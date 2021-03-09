import { 
   ActionUnion,
   NORMALIZE_PUBLICATION_LIST,
   PUBLICATION_COMPLETE,
} from '../actions';
import {
   FILTER_PUBLICATIONS_ACTION_TYPE
} from '../constants/action-types';
import {
   Publication
} from '../api/satellite';

export interface GlobalState {
   contents: Record<string, Publication>;
   publications: Publication[];
   searchTerms: string[];
}

const initialState: GlobalState = {
   contents: {},
   publications: [],
   searchTerms: [],
};

export function rootReducer(state = initialState, action: ActionUnion): GlobalState {
   if (action.type === NORMALIZE_PUBLICATION_LIST) {
      return { ...state, publications: [...action.data.publications] };
   } else if (action.type === PUBLICATION_COMPLETE) {
      return {
         ...state,
         contents: { ...state.contents, [action.data.publication.uuid]: action.data.publication },
      };
   } else if (action.type === FILTER_PUBLICATIONS_ACTION_TYPE) {
      return {
         ...state,
         publications: state.publications.filter((pub) => (
            pub._signed_.title.includes(action.payload[0]) ||
            pub._signed_.subtitle.includes(action.payload[0])
            ))
      }
      
   }

   return state;
}
