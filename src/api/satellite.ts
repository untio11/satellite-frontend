import { Epoch as testepoch } from '@satellite/epoch';
testepoch._params_;

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

export interface Contact {
   current: Epoch;
   history: Epoch[];
   options: { topics: { [topic: string]: { count: number } } };
   tracking: [];
   world: string;
}
