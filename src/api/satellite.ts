import { Torrent as WebTorrent } from 'webtorrent';

export interface Signal extends Torrent {
    sender: string;
    action: string;
    epoch: string;
    block: string;
    world: string;
    standardParams: {
        sig: string;
        alias: string;
        world: string;
        timestamp: number;
        blockNumber: number;
    };
    customParams: any;
    contained: any;
    payload: SignedContent;
    blockNumber: number;
    timestamp: number;
    located: boolean;
    dropped: boolean;
    consensus: string;
}

export interface State extends Torrent {
    store: any;
    nucleus: any;
    record: { [uuid: string]: number };
    established: number;
    updated: number;
    compressed: Uint8Array;
    initialized: boolean;
}

export interface SignedContent {
    _signed_: {
        [key: string]: any;
    };
    _params_: {
        alias: string;
        sig: string;
        [name: string]: any;
    };
}

export interface Publication extends SignedContent {
    action: string;
    announce: [];
    block: string;
    epoch: string;
    sender: string;
    verified: boolean;
}

export interface Reply {
    message: string;
    replyRef: {
        title: string;
        webId: string;
    };
    replyTo: string;
    seed: string;
    signed: string;
    timestamp: number;
    uuid: string;
}

export interface Message extends SignedContent {
    uuid: string;
    uri: string;
    authorAlias: string;
    authorAddress: string;
    signature: string;
    keys: string[];
    payload: SignedContent;
    verified: boolean;
}

export interface Torrent extends Message {
    name: string;
    sender: string;
    extension: string;
    length: number;
    pieces: string[];
    numPieces: number;
    pieceLength: number;
    lastPieceLength: number;
    info: {
        name: Uint8Array;
        length: number;
        piece: number;
        pieces: Uint8Array;
    };
    infoHash: string;
    ipfsHash: string;
}

export interface Epoch extends Torrent {
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
    | DataSentEvent;
