const WebTorrent = require('webtorrent');
const localforage = require('localforage');

const Torrent = require('@satellite-earth/torrent');
const Signal = require('@satellite-earth/signal');
const Epoch = require('@satellite-earth/epoch');


class Client {

	constructor (earth, event, config = {}) {

		if (!window) {
			throw Error('Satellite client only works in the browser');
		}

		if (!earth) {
			throw Error('Must provide Earth API instance as first argument');
		}

		// @satellite-earth/core API instance
		this.earth = earth;

		// Instantiate Webtorrent client
		this.webtorrent = new WebTorrent();

		// Create cache for data needed to synchronize with worlds
		this.syncCache = localforage.createInstance({ name: 'syncCache' });

		// Create cache for saving torrent meta data
		this.metaCache = localforage.createInstance({ name: 'metaCache' });

		// Create cache to store the torrent data chunks
		this.dataCache = localforage.createInstance({ name: 'dataCache' });

		// Optional function to get a webseed
		this.getWebseed = config.getWebseed;

		// Default torrent trackers
		this.defaultTrackers = config.defaultTrackers || [];

		// Default namespace (federated v.s. top level)
		this.defaultNamespace = config.defaultNamespace || null;

		// In memory record of data keys speeds up ops
		// when iterating across many torrent chunks
		this.dataKeys = {};

		// Keep track of total amount of data cached for each torrent
		this.loaded = {};

		// Worlds that this client tracks
		this.worlds = {};

		// Attach generic event handler
		this.event = (name, data, params) => {
			if (event) { event(name, data, params); }
		};

		// If wallet connected, setup event to fire when
		// user's name when a new address is selected so
		// the application can update its UI if need be
		this.handleAccountsChanged();

		// Returns a new instance of the custom data store
		// to save torrents in browser's persistent storage
		// following npmjs.com/package/abstract-chunk-store
		this.store = (dataCache, dataKeys, loaded, event) => {
			
			const store = function Store (pieceLength, opts) {

				const { torrent, length } = opts;

				// Infohash of the torrent
				this.infoHash = torrent.infoHash;

				// Total length of all pieces
				this.length = length;

				// Torrent piece length
				this.pieceLength = pieceLength;

				// Integer number of chunks in file
				this.numPieces = Math.ceil(length / pieceLength);

				// Chunks are cached in memory too since it's
				// faster than always accessing local storage
				this.memCache = [];

				// Record total loaded data for this torrent
				this.loaded = loaded;
				this.loaded[torrent.infoHash] = 0;
				
				// As per abstract chunk store spec
				this.closed = false;
			};

			store.prototype.put = function (index, data, cb) {

				// Store in memory for fast loading
				this.memCache[index] = data;
				this.loaded[this.infoHash] += data.length;

				// Also save new chunks in the local cache
				const key = `${this.infoHash}.${index}`;
				dataCache.setItem(key, data, (err) => {
					if (!err) {
						dataKeys[key] = true;
						event('data_cached', {
							infoHash: this.infoHash,
							bytes: data.length,
							index
						});
						cb(null);
					} else {
						cb(err);
					}
				});
			}

			store.prototype.get = function (index, opts, cb) {
				
				// See if chunk is in memory first
				const mem = this.memCache[index];
				if (mem) {
					cb(null, mem);
				} else {

					// Fall back to fetching chunk from local storage
					dataCache.getItem(`${this.infoHash}.${index}`, (err, cached) => {
						if (cached) { // Locally cached piece found

							// Cache in memory to speed up next read
							const data = Buffer.from(cached);
							this.memCache[index] = data;
							this.loaded[this.infoHash] += data.length;
							cb(null, data); // Return data

						} else { // Will need to download from swarm
							cb(new Error('Failed to get cached data'));
						}
					});
				}
			};

			store.prototype.close = function (cb) {
				this.memCache = [];
				this.loaded[this.infoHash] = 0;
				this.closed = true;				
			};

			store.prototype.destroy = function (cb) {
				// Nothing to see here - just for
				// the abstract chunk store spec
			};

			return store;
		};
	}

	// Synchronize client with a world instance
	async contact (world, options = {}) {

		if (typeof world === 'undefined') {
			throw Error('Must specify \'world\'');
		}

		if (typeof options.endpoint === 'undefined') {
			throw Error('Must specify \'options.endpoint\'');
		}

		try {

			let signals = [];
			let cachedEpoch;

			if (!options.skipCache && !options.skipCurrent) {

				// Check if there are any cached signals for this world
				const cachedMeta = await this.syncCache.getItem(`world:${world}/meta`);

				// If meta data for a partial epoch was found
				if (cachedMeta) {

					try {

						// Model the epoch and inflate with any cached signals
						cachedEpoch = new Epoch(JSON.parse(cachedMeta));
						const cachedSignals = await this.syncCache.getItem(`world:${world}/data`);

						if (cachedSignals) {
							await cachedEpoch.data(Buffer.from(cachedSignals));
							signals = cachedEpoch.signals;
						}

					} catch (err) {
						console.warn('Failed to load cached epoch data');
					}
				}
			}

			// Location of remote world instance
			const { endpoint } = options;
			let uri = `${endpoint}/contact`;

			if (options.skipCurrent) {

				// Tell the server not to send the signals for the current
				// epoch. This is useful for speeding up page load times
				// when the client doesn't care about non-finalized data.
				uri += '?signals=false';

			} else if (signals.length > 0) { // If cached signals were found

				// Only fetch signals which are timestamped later than last contact
				uri += `?since=${signals[signals.length - 1].blockNumber}`;
			}

			// Get meta data for previous epochs and the
			// signals/initial states of current epoch
			let reply = await fetch(uri);
			reply = await reply.json();

			// Initialize namespace(s) as returned bey
			// contacted world or as optional override
			const ns = {
				...(reply.current.ns || {}),
				...(options.ns || {})
			};

			// Add nameservers reported by world
			for (let name of Object.keys(ns)) {
				await this.earth.addNameserver(ns[name]);
			}

			// Model historical epochs
			const history = reply.history.map(past => {
				return new Epoch(past);
			});

			// Model the current epoch
			const current = new Epoch(reply.current.epoch);

			// States that client wants to build
			const tracking = options.tracking || [];

			// Discard cached signals if epoch has been superseded
			if (cachedEpoch && cachedEpoch.number !== current.number) {
				signals = [];
			}

			// Get uuids of signals dropped by world and filter cached
			// signals unless the client has explicitly set drop=false 
			const dropped = reply.current.dropped || [];
			signals = signals.filter(signal => {
				return options.drop === false || dropped.indexOf(signal.uuid) === -1;
			});

			// Load initial states and signals included so far, merging
			// new signals with same-epoch signals found in the cache
			await current.build({
				initial: reply.current.initial,
				signals: signals.concat(reply.current.signals)
			}, async (state) => {

				// Don't auto-build a state unless it is explicitly indicated.
				// States can be quite large, so client may wish to wait for a
				// user action, certain route, etc. before building the state.
				if (tracking.indexOf(state.name) === -1) {
					return false;
				}

				// If data is available from cache, build the state
				return await this.getCachedData(state.infoHash, {
					length: state.dataParams.size,
					pieceLength: state.pieceLength,
					buffer: true
				});
			});
			
			// Assemble a model of the world at the present moment,
			// including the source of signals and states tracked,
			// adding custom contact response options if present.
			this.worlds[world] = { history, current, tracking, endpoint };
			if (typeof reply.options !== 'undefined') {
				this.worlds[world].options = reply.options;
			}
			
			// Cache up-to-date current epoch for future calls,
			// overwriting cached signals from previous epochs.
			await this.syncCache.setItem(`world:${world}/meta`, current.toString());
			await this.syncCache.setItem(`world:${world}/data`, current.compressed);

			// Fire event with newly contacted world
			this.event('contact', { world, ...this.worlds[world] });

			// If contacted world is using the default
			// namespace, fire event identifying user
			// based on currently selected address.
			if (
				options.identify !== false
				&& this.earth.provider
				&& this.earth.nameserver[this.defaultNamespace]
			) {

				const info = await this.earth.identify({ namespace: this.defaultNamespace });
				this.event('identify', info);
			}

			// Iterate across the newly loaded world's states
			for (let stateName of Object.keys(this.worlds[world].current.state)) {

				const state = this.worlds[world].current.state[stateName];

				if (state.initialized) {

					// Fire event for each of those states initialized on contact,
					// which are either a state tracked by the client whose data was
					// already locally cached, or a new state created by evolve signal.
					this.event('state_initialized', {
						epochNumber: current.number,
						world,
						state
					});

				} else if (tracking.indexOf(state.name) !== -1) {

					// For states that the client is tracking but whose initial
					// data is not available, start torrenting it - when download
					// is done the client will automatically initialize the state.
					this.load(state);
				}
			}

			// Optionally, start loading specified number of previous epochs
			if (typeof options.previous !== 'undefined') {
				const h = this.worlds[world].history;
				const n = options.previous === 'all'
				|| options.previous > h.length ? h.length : options.previous;
				for (let e = 0; e < n; e++) { this.load(h[e]); }
			}

		} catch (err) {
			console.log(err);
			this.event('contact_failed', { world, error: err });
		}
	}

	// Get the params for sending a signal
	async target (world, action, options = {}) {

		let target;

		try {

			// Acquire signal target
			const resp = await fetch(`${options.endpoint || this.worlds[world].endpoint}/target`);
			target = await resp.json();
			target.action = action;

			// Add alias params as necessary
			if (!options.anonymous) {

				// Identify sender with reference to given
				// namespace, falling back to top level
				let namespace = options.namespace;
				let sender = options.sender;

				if (typeof namespace === 'undefined') {
					namespace = this.defaultNamespace;
				}

				if (typeof options.sender === 'undefined') {
					const info = await this.earth.identify({ namespace });
					sender = info.name;
				}

				// Assign signal sender and namespace
				target.namespace = namespace;
				target.sender = sender;
			}

		} catch (err) {
			throw Error('Signal targeting failed', err);
		}

		return target;
	}

	// Send a signal to a world
	async signal (world, action, payload, options = {}) {

		// Target the signal
		const target = await this.target(world, action, options);

		// Construct the signal model
		const signal = new Signal(payload, target);

		// Sign the signal to prove authorship
		await signal.sign(this.earth, options);

		// Apply optional preflight checks
		if (options.preflight) { await options.preflight(signal); }

		// Optional endpoint overrides world default
		const endpoint = options.endpoint || this.worlds[world].endpoint;

		// Send the signal to the world's endpoint
		await fetch(`${endpoint}/signal`, {
			body: JSON.stringify(signal.payload),
			method: 'POST',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			}
		});

		return signal;
	}

	// Download or start seeding a torrent
	async load (input, params = {}) {

		if (!input) {
			throw Error('Must provide torrent meta data');
		}

		// Custom params to pass with each event for this torrent
		const eventParams = params.eventParams || {};

		// Options to be passed through to webtorrent.add()
		const addOptions = params.addOptions || {};

		// Called when torrent is complete
		const complete = (_torrent) => {

			// Get the file's data as a Buffer
			_torrent.files[0].getBuffer(async (err, data) => {
				if (err) {
					console.warn('Client encountered unknown error');
				} else {

					this.event('torrent_complete', {
						torrent: _torrent,
						data
					}, eventParams);

					// For each world that has been contacted
					for (let world of Object.keys(this.worlds)) {

						// Check if the torrent matches any uninitialized
						// states that the client is currently tracking
						for (let initial of this.worlds[world].current.initial) {

							if ( // If so...
								this.worlds[world].tracking.indexOf(initial.name) !== -1
								&& initial.infoHash === _torrent.infoHash
								&& !initial.initialized
							) {

								// Rebuild the current epoch to include the new
								// state now that the initial data is available
								await this.worlds[world].current.build(null, async (state) => {

									if (state.infoHash !== initial.infoHash) {
										return;
									}

									return data;
								});

								// Fire event with initialized state because the
								// app probably wants to do something with it
								this.event('state_initialized', {
									state: this.worlds[world].current.state[initial.name],
									epochNumber: this.worlds[world].current.number,
									world
								}, eventParams);
							}
						}

						// Check if torrent matches an uninitialized historical epoch
						for (let epoch of this.worlds[world].history) {

							if ( // If so...
								epoch.infoHash === _torrent.infoHash
								&& !epoch.initialized
							) {

								// Inflate the epoch with the torrent data
								await epoch.data(data);

								// Fire event with initialized epoch because the
								// app probably wants to do something with it
								this.event('epoch_initialized', { epoch, world }, eventParams);
							}
						}
					}
				}
			});
		};

		// Establish whether torrent should be added
		const proceed = (infoHash) => {

			if (!infoHash) {
				return false;
			}

			// Check if torrent is already active
			const active = this.getTorrent(infoHash);
			if (active && active.files[0]) {

				// If torrent is done, fire complete
				if (active.done) {
					complete(active);
				}

				return false; // Don't add duplicate
			}

			return true; // Go ahead
		};

		let torrent; // WebTorrent's model
		let id; // Identifying meta data

		// Presence of 'infoHash' property indicates existing model,
		// otherwise fall back to the basic torrent constructor.
		const model = input.infoHash ? input : new Torrent(input);

		// Check for reserved event params
		for (let k of Object.keys(eventParams)) {
			if (k === 'event' || k === 'data') {
				throw Error(`'${k}' is reserved. Please use a different key for your custom event param.`);
			}
		}

		if (proceed(model.infoHash)) {

			// List of torrent trackers
			const announce = params.announce ? [
				...params.announce,
				...this.defaultTrackers
			] : this.defaultTrackers;

			// Webseeds for this torrent
			const urlList = [];

			// Optional async function returns webseed which
			// is added the torrent's url list (http sources)
			// If there is any additional information needed
			// to fetch a webseeed (such as an auth token) it
			// should be passed in eventParams on call to load,
			// so that the 'getWebseed' function can use it.
			if (this.getWebseed) {
				try {
					const webseed = await this.getWebseed(model, eventParams);
					urlList.push(webseed);
				} catch (getWebseedErr) {
					console.warn('Failed to get webseed');
				}
			}

			// Construct native torrent model with params
			id = model.getParsedTorrent({ announce, urlList });
		}

		// If torrent identifier was resolved
		if (id) {

			// Add new torrent and attach event listeners
			torrent = this.webtorrent.add(id, {
				store: this.store(this.dataCache, this.dataKeys, this.loaded, this.event),
				...addOptions
			});

			// Call complete() when torrent is done
			torrent.on('done', () => { complete(torrent); });

			// Emit requested event on resolved meta data
			torrent.on('infoHash', () => {
				this.event('torrent_requested', {
					torrent
				}, eventParams);
			});

			// Name, pieces, piece length, and size determined
			torrent.on('metadata', async () => {

				let loaded = 0;

				// Save info dict in the meta cache
				this.cacheTorrentMeta(torrent.infoHash, torrent.info);

				// Add up the amount of data in the cache before firing event.
				// The reason that WebTorrent's "downloaded" function is not
				// used is becuase Satellite's reimplementation of the chunk
				// store in the persistent cache (instead of memory) introduces
				// a delay when getting pieces, necessitating asynchronous ops.
				await this.traverseCachedDataKeys(torrent.infoHash, (key, { index }) => {
					if (index === torrent.pieces.length - 1) {
						loaded += torrent.lastPieceLength;
					} else {
						loaded += torrent.pieceLength;
					}
				});

				this.event('torrent_added', { // Emit added event
					loaded: loaded > torrent.length ? torrent.length : loaded,
					torrent
				}, eventParams);
			});

			// Emit event when torrent receives data,
			// useful for showing progress indicator
			torrent.on('download', (bytes) => {
				this.event('data_loaded', {
					loaded: this.loaded[torrent.infoHash],
					torrent,
					bytes
				}, eventParams);
			});

			// Emit event when data is sent to a peer
			torrent.on('upload', (bytes) => {
				this.event('data_sent', { torrent, bytes }, eventParams);
			});
		}
	};

	// Removes a torrent from WebTorrent. If options.removeData
	// is true, also delete all torrent chunks from local cache
	async remove (infoHash, options = {}) {

		if (!infoHash) {
			throw Error('Must provide infoHash of torrent to remove');
		}

		// If torrent currently active, remove it
		if (this.getTorrent(infoHash)) {
			this.webtorrent.remove(infoHash);
		}

		if (options.removeData) {

			// Remove chunks from data cache
			const ops = await this.traverseCachedDataKeys(infoHash, (key, { index }) => {
				return this.removeTorrentChunk({ infoHash, index });
			});

			// Wait until ops complete
			await Promise.all(ops);

			// Remove info from meta cache
			await this.metaCache.removeItem(infoHash);
			this.event('torrent_removed', { infoHash });

		} else {
			this.event('torrent_stopped', { infoHash });
		}
	}

	// Store a torrent's meta data in local cache
	async cacheTorrentMeta (infoHash, meta) {
		await this.metaCache.setItem(infoHash, meta);
	}

	// Low-level method for storing torrent data manually.
	// Torrent chunks are automatically cached as they are
	// downloaded, so this method is only necessary if you
	// are loading data into cache from an external source
	async cacheTorrentData (data, params) {

		if (!(data instanceof Blob)) {
			throw Error('First argument must be a Blob or File');
		}

		if (!params || !params.infoHash) {
			throw Error('Expected \'infoHash\' in params object');
		}

		const { infoHash, pieceLength } = params;
		const len = data.size;

		// If piece length not explicit, go with
		// Satellite's default chunking strategy
		let p = pieceLength || Torrent.inferPieceLength(len);

		// Calculate the number of pieces
		const n = Math.ceil(len / p);

		const fileReader = new FileReader();
		fileReader.onload = async (event) => {
		  const arrayBuffer = event.target.result;
			for (let z = 0; z < n; z++) {
				const start = z * p;
				const slice = arrayBuffer.slice(start, start + (z === n - 1 ? len % p || p : p));
				await this.cacheTorrentChunk(new Uint8Array(slice), { infoHash, index: z });
			}
		};

		fileReader.readAsArrayBuffer(data);
	};

	// Abstract function for iterating across every
	// chunk of a given torrent in the data store
	async traverseCachedDataKeys (infoHash, f) {

		// If data keys are not initialized, fetch
		// from local cache and populate in-memory
		// to avoid unneccessary slow async calls
		if (Object.keys(this.dataKeys).length === 0) {
			const keys = await this.dataCache.keys();
			for (let key of keys) {
				this.dataKeys[key] = true;
			}
		}

		const ops = [];
		for (let k of Object.keys(this.dataKeys)) {
			const _k = k.split('.');
			if (infoHash === null || _k[0] === infoHash) {
				ops.push(f(k, { infoHash: _k[0], index: parseInt(_k[1]) }));
			}
		}

		return ops;
	}

	// Get a torrent's chunks from data store and
	// concatenate them to return a blob/buffer
	async getCachedData (infoHash, options = {}) {

		const { length, pieceLength } = options;

		if (!infoHash) {
			throw Error('Must provide infoHash');
		}

		if (!length) {
			throw Error('Must provide length')
		}

		// Establish the piece length and number of pieces
		let p = pieceLength || Torrent.inferPieceLength(length);
		if (length < p) { p = length; }
		const n = Math.ceil(length / p);

		// Allocate an array to hold the data,
		// then fetch each chunk and append
		const data = new Uint8Array(length);	

		for (let z = 0; z < n; z++) {

			// Get the torrent chunk from data cache
			const chunk = await this.dataCache.getItem(`${infoHash}.${z}`);

			// If torrent data incomplete, return undefined
			if (!chunk) {
				return;
			}

			// Write chunk to array
			data.set(new Uint8Array(chunk), z * p);
		}

		// Return blob by default, optionally buffer
		return options.buffer ? Buffer.from(data) : new Blob([ data ]);
	}

	// Returns a list of info for cached torrents
	async listCache () {

		let _initial;
		let _final;

		const metaKeys = await this.metaCache.keys();

		const metaMap = {};
		const dataMap = {};
		const list = [];

		// Build a map of all the chunks in the data cache
		await this.traverseCachedDataKeys(null, (key, _key) => {
			if (dataMap[_key.infoHash]) {
				dataMap[_key.infoHash].push(_key.index);
			} else {
				dataMap[_key.infoHash] = [ _key.index ];
			}
		});

		// For each unique torrent
		for (let infoHash of metaKeys) {

			// Establish the torrent's data parameters and
			// prepare to iterate across expected chunks
			const meta = await this.metaCache.getItem(infoHash);
			const model = new Torrent(meta);
			const lastPieceLength = model.lastPieceLength;
			const pieceLength = model.pieceLength;
			const numPieces = model.numPieces;
			const data = dataMap[infoHash];
			let cachedPieces = [];
			let cachedBytes = 0;

			if (Array.isArray(data)) { // Found cached pieces

				// Get piece list and add up the number of cached bytes
				cachedPieces = data.sort((a, b) => { return a - b; });
				for (let index of cachedPieces) {
					if (index === numPieces - 1) { // Last piece
						cachedBytes += model.lastPieceLength;
					} else {
						cachedBytes += pieceLength;
					}
				}
			}

			list.push({
				info: model.info,
				fileName: model.name,
				infoHash: model.infoHash,
				length: model.length,
				lastPieceLength,
				pieceLength,
				cachedPieces,
				cachedBytes,
				numPieces
			});
		}

		return list;
	}

	// Build user directory from blockchain data
	async synchronizeDirectory (toBlock) {

		// Check for previously cached data
		const cached = await this.syncCache.getItem('directory');

		// Inflate from cached data if available
		if (cached) {
			this.earth.directory.inflate(cached);
		}

		// Get latest directory data from blockchain
		await this.earth.synchronizeDirectory(toBlock);

		// Overwrite cached directory data with latest
		await this.syncCache.setItem('directory', this.earth.directory.compressed);
	}

	// Low-level method used to cache a torrent chunk.
	// You should only use this method if you need to
	// cache partial data loaded from external source.
	cacheTorrentChunk (data, { infoHash, index }) {
		const key = `${infoHash}.${index}`;
		this.dataKeys[key] = true;
		return this.dataCache.setItem(key, data);
	};

	// Low-level method to delete a chunk from the store
	removeTorrentChunk ({ infoHash, index }) {
		const key = `${infoHash}.${index}`;
		delete this.dataKeys[key];
		return this.dataCache.removeItem(key);
	}

	// Return torrent model from WebTorrent instance
	getTorrent (infoHash) {
		for (let torrent of this.webtorrent.torrents) {
			if (infoHash === torrent.infoHash) { return torrent; }
		}
		return null;
	};

	// Get an object url to display a torrent's data in
	// the browser. It's important to note that it is the
	// application's responsibilty to revoke the url when
	// no longer being used in order to avoid memory leaks.
	getObjectUrl (infoHash) {
		return new Promise((resolve, reject) => {
			const torrent = this.getTorrent(infoHash);
			if (!torrent) {
				reject(Error('Torrent not active'));
			}
			torrent.files[0].getBlobURL((err, url) => {
				if (err) {
					reject(err);
				} else {
					resolve(url);
				}
			});
		});
	}

	// Default behavior to handle new account selected
	handleAccountsChanged (f) {

		if (!this.earth.provider) { return; }

		const defaultHandler = async (addresses) => {

			// NOTE: the "shouldUpdate" logic only fires the first event if
			// this function is invoked twice within 100ms. This is only
			// necessary to work around an unresolved bug in the metamask
			// iOS mobile provider which incorrently double-calls the event
			// See: https://github.com/MetaMask/metamask-mobile/issues/2025

			let shouldUpdate;

			if (typeof this._updatedAccounts === 'undefined') {
				this._updatedAccounts = Date.now();
				shouldUpdate = true;
			} else if (Date.now() - this._updatedAccounts > 100) {
				shouldUpdate = true;
			}

			if (shouldUpdate) {
				
				this._updatedAccounts = Date.now();

				if (f) { f(addresses, this); } else {

					const info = await this.earth.identify({
						namespace: this.defaultNamespace,
						address: addresses[0]
					});

					this.event('identify', info);
				}
			}				
		};

		this.earth.provider.on('accountsChanged', defaultHandler);
	};
}

module.exports = Client;
