declare module '@satellite-earth/epoch' {
    export interface IEpoch {
        signals: Signal[];
        states: State[];
        initial: State[];
        ancestor: string;
        signer: string;
        number: number;
        alpha: number;
        finalized: boolean;
        compressed: Uint8Array;
        included: { [uuid: string]: SignedContent };
    }
    export class Torrent {
        public name: string;
        public sender: string;
        public extension: string;
        public length: number;
        public pieces: string[];
        public numPieces: number;
        public pieceLength: number;
        public lastPieceLength: number;
        public info: {
            name: Uint8Array;
            length: number;
            piece: number;
            pieces: Uint8Array;
        };
        public infoHash: string;
        public ipfsHash: string;
    }

    export default class Epoch extends Torrent {
        public signals: Signal[];
        public states: State[];
        public initial: State[];
        public ancestor: string;
        public signer: string;
        public number: number;
        public alpha: number;
        public finalized: boolean;
        public compressed: Uint8Array;
        public included: { [uuid: string]: SignedContent };
        constructor(epoch?: IEpoch);
        public data(data: IEpoch);
    }
}
declare module '@satellite-earth/publication' {
    export default Publication;
}

class Earth {
    [x: string]: any;
}

declare module '@satellite-earth/client' {
    export interface CorruptEvent {
        type: string;
        data: any;
    }
    export interface ContactEvent {
        type: EventNames.CONTACT;
        data: {
            world: string;
            current: Epoch;
            history: Epoch[];
            tracking: State[];
            endpoint: string;
            options: { topics: { [topic: string]: { count: number } } }; // Not documented in the docs?
        };
    }

    export interface ContactFailedEvent {
        type: EventNames.CONTACT_FAILED;
        data: {
            world: string;
            error: any;
        };
    }

    export interface StateInitiliazedEvent {
        type: EventNames.STATE_INITIALIZED;
        data: {
            world: string;
            state: State;
            epochNumber: Number;
        };
    }

    export interface TorrentAddedEvent {
        type: EventNames.TORRENT_ADDED;
        data: {
            torrent: WebTorrent;
            loaded: number;
        };
    }

    export interface TorrentStoppedEvent {
        type: EventNames.TORRENT_STOPPED;
        data: {
            infoHash: string;
        };
    }

    export interface TorrentRemovedEvent {
        type: EventNames.TORRENT_REMOVED;
        data: {
            infoHash: string;
        };
    }

    export interface TorrentCompleteEvent {
        type: EventNames.TORRENT_COMPLETE;
        data: {
            torrent: WebTorrent;
            data: Uint8Array;
        };
    }

    export interface DataLoadedEvent {
        type: EventNames.DATA_LOADED;
        data: {
            torrent: WebTorrent;
            bytes: number;
            loaded: number;
        };
    }

    export interface DataCachedEvent {
        type: EventNames.DATA_CACHED;
        data: {
            torrent: WebTorrent;
            bytes: number;
            index: number;
        };
    }

    export interface DataSentEvent {
        type: EventNames.DATA_SENT;
        data: {
            torrent: WebTorrent;
            bytes: number;
        };
    }

    export enum EventNames {
        CONTACT = 'contact',
        CONTACT_FAILED = 'contact_failed',
        STATE_INITIALIZED = 'state_initialized',
        TORRENT_ADDED = 'torrent_added',
        TORRENT_STOPPED = 'torrent_stopped',
        TORRENT_REMOVED = 'torrent_removed',
        TORRENT_COMPLETE = 'torrent_complete',
        DATA_LOADED = 'data_loaded',
        DATA_CACHED = 'data_cached',
        DATA_SENT = 'data_sent'
    }

    export type EventUnion =
        | ContactEvent
        | ContactFailedEvent
        | StateInitiliazedEvent
        | TorrentAddedEvent
        | TorrentStoppedEvent
        | TorrentRemovedEvent
        | TorrentCompleteEvent
        | DataLoadedEvent
        | DataCachedEvent
        | DataSentEvent
        | CorruptEvent;

    export type clientEventFunction = (
        event: EventNames,
        data: EventUnion,
        params: Record<string, any>
    ) => void;

    export default class Client {
        constructor(earth: Earth, fn: clientEventFunction, options?: Record<string, any>);
        [x: string]: any;
    }
}

declare module '@satellite-earth/core' {
    export default class Core {
        [x: string]: any;
    }
    export class Earth {
        [x: string]: any;
    }
}
