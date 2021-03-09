import Store from '../store';
import { Earth } from '@satellite-earth/core';
import Client from '@satellite-earth/client';
import { addEpochs, addPublications, epochComplete, publicationComplete } from '../actions';
import { Torrent } from './satellite';
import axios from 'axios';
import {
   EventUnion,
   EventNames,
   ContactEvent,
   ContactFailedEvent,
   StateInitiliazedEvent,
   TorrentAddedEvent,
   TorrentCompleteEvent,
   TorrentRemovedEvent,
   TorrentStoppedEvent,
   DataCachedEvent,
   DataLoadedEvent,
   DataSentEvent,
} from '../api/satellite';

export const API_URL = 'https://api.satellite.earth';
export const NAMESPACE = 'earth';
export const TRACKER_ENDPOINTS = [
   'wss://tracker.satellite.earth:443/announce',

   // TODO need to add other public trackers so the
   // data can be downloaded by external clients

   //'ws://10.0.0.35:8000/announce'
   // 'udp://tracker.opentrackr.org:1337/announce',
   // 'udp://tracker.leechers-paradise.org:6969/announce',
   // 'udp://tracker.internetwarriors.net:1337/announce',
   // 'udp://9.rarbg.me:2710/announce',
   // 'udp://9.rarbg.to:2710/announce',
   // 'udp://p4p.arenabg.com:1337/announce',
   // 'udp://exodus.desync.com:6969/announce',
   // 'udp://tracker.cyberia.is:6969/announce',
   // 'udp://open.stealth.si:80/announce',
   // 'udp://tracker.tiny-vps.com:6969/announce',
   // 'udp://retracker.lanta-net.ru:2710/announce',
   // 'udp://tracker3.itzmx.com:6961/announce',
   // 'udp://tracker.torrent.eu.org:451/announce',
   // 'http://tracker4.itzmx.com:2710/announce',
   // 'http://tracker1.itzmx.com:8080/announce',
   // 'udp://tracker.moeking.me:6969/announce',
   // 'udp://bt2.archive.org:6969/announce',
   // 'udp://bt1.archive.org:6969/announce',
   // 'udp://ipv4.tracker.harry.lu:80/announce',
   // 'udp://explodie.org:6969/announce'
];
export const getWebseed = async (torrent: Torrent, eventParams: Record<string, any> = {}) => {
   // Get the author alias from the torrent model or
   // if that fails fall back to event params
   let alias = torrent.authorAlias || torrent.sender;

   if (!alias) {
      alias = eventParams.alias;
   }

   let uri = `${API_URL}/media/webseed?alias=${alias}&infoHash=${torrent.infoHash}`;

   //if (eventParams.epoch) { uri += 'epoch=true'; }

   const resp = await axios.get(uri);
   return resp.data;
};

const EventMapper: Record<
   EventNames,
   (response: EventUnion, params: Record<string, any>) => void
> = {
   contact: (response, params) => {
      response = response as ContactEvent;
      Store.dispatch(addPublications(response.data.current.signals, response.data.current.number));
      Store.dispatch(addEpochs(response.data.history));

      for (const epoch of response.data.history) {
         client.load(epoch, {
            directDownload: true,
            eventParams: {
               alias: 'satellite',
               isEpoch: true,
            },
         });
         break;
      }

      console.log(response.data);
   },
   contact_failed: (response, params) => {
      response = response as ContactFailedEvent;
   },
   state_initialized: (response, params) => {
      response = response as StateInitiliazedEvent;
   },
   torrent_added: (response, params) => {
      response = response as TorrentAddedEvent;
   },
   torrent_complete: (response, params) => {
      response = response as TorrentCompleteEvent;
      const data = response.data;

      if (params.isEpoch) {
         const { epochs } = Store.getState();
         for (let epoch of epochs) {
            if (epoch.infoHash === data.torrent.infoHash) {
               Store.dispatch(epochComplete(epoch, data.data, params));
               // break to only load one, we could load multiple or all if we want
               break;
            }
         }
      } else if (params.isPublication) {
         const { publications } = Store.getState();

         // When a publication torrent completes, first check if the torrent
         // infoHash matches a pub that is currently being viewed (i.e. user
         // loaded the publication page). If not, it means the publication is
         // being loaded to get media data, so need to loop through the list.

         const infoHashMatchesPublication = publications.find(
            (p) => p.infoHash === data.torrent.infoHash
         );

         if (infoHashMatchesPublication) {
            Store.dispatch(publicationComplete(infoHashMatchesPublication, data.data, params));
         } else {
            for (let item of publications) {
               if (item.infoHash === data.torrent.infoHash) {
                  Store.dispatch(publicationComplete(item, data.data, params));
                  break;
               }
            }
         }
      }
   },
   torrent_removed: (response, params) => {
      response = response as TorrentRemovedEvent;
   },
   torrent_stopped: (response, params) => {
      response = response as TorrentStoppedEvent;
   },
   data_cached: (response, params) => {
      response = response as DataCachedEvent;
   },
   data_loaded: (response, params) => {
      response = response as DataLoadedEvent;
   },
   data_sent: (response, params) => {
      response = response as DataSentEvent;
   },
};

const earth = new Earth();
const client = new Client(
   earth,
   (event: EventNames, data: EventUnion, params: Record<string, any>) => {
      const fn = EventMapper[event];
      if (fn) fn({ type: event, data: data }, params);
      else {
         console.log(data);
         console.log(event);
         console.log(params);
      }
   },
   {
      getWebseed,
      defaultNamespace: NAMESPACE,
      defaultTrackers: TRACKER_ENDPOINTS,
      autoInitStates: false,
      autoInitEpochs: false,
   }
);

export default client;
