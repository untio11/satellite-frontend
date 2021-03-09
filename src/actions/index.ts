import { Dispatch } from 'redux';
import { Epoch as IEpoch, Signal } from '../api/satellite';
import Publication from '@satellite-earth/publication';
import Epoch from '@satellite-earth/epoch';
import { ADD_EPOCHS_ACTION_TYPE, TEST_TYPE } from '../constants/action-types';
import { TestState } from '../reducers';
import ClientInstance from '../api/client';

export interface TestPayload {
   content: string;
}

export function testAction(payload: TestPayload) {
   return { type: TEST_TYPE, payload };
}

export function addPublications(signals: Publication[], epochNumber: number) {
   return (dispatch: Dispatch) => {
      dispatch(
         normalizeEpochData(signals, {
            epochNumber: epochNumber,
            dirSort: 'POPULAR',
         })
      );
   };
}

export function addEpochs(epochs: IEpoch[]) {
   return {
      type: ADD_EPOCHS_ACTION_TYPE,
      data: {
         epochs: epochs,
      },
   };
}

export type TestActionType = ReturnType<typeof testAction>;
export type AddPublicationType = ReturnType<typeof addPublications>;
export type AddEpochsType = ReturnType<typeof addEpochs>;

export type ActionUnion =
   | TestActionType
   | INormalizePublications
   | ICompletePublication
   | AddEpochsType;

export const NORMALIZE_PUBLICATION_LIST = 'NORMALIZE_PUBLICATION_LIST';
export const normalizePublicationList = (data: Publication[], options = {}) => {
   return (dispatch: Dispatch, getState: () => TestState) => {
      const { publications } = getState();

      // Remove previous verions of publications from list
      const deduplicate = (list: Publication[]) => {
         const n = list.length;
         const versions: Record<string, Publication> = {};
         const latest = [];
         const map: Record<string, Publication> = {};

         for (let z = 0; z < n; z++) {
            const p = list[z];
            const sender = p.sender;
            const _title = p.title;

            if (!map[sender]) {
               map[sender] = {};
            }

            if (!versions[sender]) {
               versions[sender] = {};
            }

            const existing = map[sender][_title];
            if (!existing || existing.timestamp < p.timestamp) {
               map[sender][_title] = p;
            }

            if (!versions[sender][_title]) {
               versions[sender][_title] = [];
            }

            versions[sender][_title].push(p.uuid);
         }

         for (let author of Object.keys(map)) {
            for (let title of Object.keys(map[author])) {
               latest.push(map[author][title]);
            }
         }

         return { latest, versions };
      };

      let latest = publications;

      if (data !== null) {
         const normalized = deduplicate([...(data || []), ...publications]);
         latest = normalized.latest;
      }

      dispatch({
         type: NORMALIZE_PUBLICATION_LIST,
         data: {
            publications: latest,
         },
      });
   };
};

export interface INormalizePublications {
   type: typeof NORMALIZE_PUBLICATION_LIST;
   data: {
      publications: Publication[];
   };
}

export const normalizeEpochData = (signals: Signal[], options: Record<string, any> = {}) => {
   const newPublications: Publication[] = [];
   const messages = [];
   const titleMap: Record<string, string> = {};

   // Loop through publications and messages first,
   // mapping title to uuid so seed orders can
   // mark themselves as "replyTo" referenced uuid.
   for (let signal of signals) {
      if (signal.action === 'message' || signal.action === 'seed') {
         messages.push(signal);
      } else if (signal.action === 'publish') {
         const payload = signal.payload;
         payload._params_.epochNumber = options.epochNumber;
         const model = new Publication(payload);
         newPublications.push(model);
         titleMap[model.title as string] = model.uuid;
      }
   }

   // Add uuid reference to seed orders so they can
   // be looked up in forum when loading pub replies
   // seedOrders = seedOrders.map(order => {
   // 	order._signed_.replyTo = titleMap[order._signed_.seed.split(' : ')[1]];
   // 	//order._params_.seed = order._signed_.seed.split(' : ')[1];
   // 	messages.push(order);
   // 	return order;
   // });

   return async (dispatch: Dispatch, getState: () => TestState) => {
      //dispatch(normalizeSeedOrders(seedOrders));

      // Get reply and seeding totals from server,
      // populate params on the new publications
      // const metrics = await getMetrics(options.epochNumber);

      // newPublications.forEach((item) => {
      //    if (metrics[item.sender] && metrics[item.sender][item.title]) {
      //       item.addParams(metrics[item.sender][item.title]);
      //    }
      // });

      const { publications } = getState();
      const _publications = [...publications, ...newPublications];

      dispatch(normalizePublicationList(_publications, options));
   };
};

export const PUBLICATION_COMPLETE = 'PUBLICATION_COMPLETE';
export const publicationComplete = (publication: Publication, data: any, options: any) => {
   return async (dispatch: Dispatch) => {
      // publication.trust();

      await publication.data(data);

      // IDEA . . . save all contained media in the
      // meta cache

      // If it exists, call function with
      // publication after adding data
      if (options.onComplete) {
         options.onComplete(publication);
      }

      dispatch({ type: PUBLICATION_COMPLETE, data: { publication } });
   };
};

export interface ICompletePublication {
   type: typeof PUBLICATION_COMPLETE;
   data: {
      publication: Publication;
   };
}

export const loadEpochTorrent = (epoch: IEpoch) => {
   return (dispatch: Dispatch, getState: () => TestState) => {
      const model = epoch instanceof Epoch ? epoch : new Epoch(epoch);
      const active = ClientInstance.getTorrent(epoch.infoHash);

      if (!active) {
         // Load torrent if not already
         ClientInstance.load(model, {
            directDownload: true,
            eventParams: {
               alias: 'satellite',
               isEpoch: true,
            },
         });
      }
   };
};

export const EPOCH_COMPLETE = 'EPOCH_COMPLETE';
export const epochComplete = (epoch: Epoch, data: any, eventParams: any) => {
   return async (dispatch: Dispatch, getState: () => TestState) => {
      // Create a new model for extracting signals
      // so the model will get garbage-collected,
      // there's no reason to maintain the array
      // of signals since they get stored in the
      // publications list and the forum instance.

      // epoch.trust();

      // Load the torrent data
      await epoch.data(data);

      // Pass the unpacked signals to be processed
      dispatch(
         normalizeEpochData(epoch.signals, {
            epochNumber: epoch.number,
         })
      );
   };
};
