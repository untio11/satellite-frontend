import { ActionUnion, NORMALIZE_PUBLICATION_LIST, PUBLICATION_COMPLETE } from '../actions';
import Publication from '@satellite-earth/publication';
import { Epoch } from '../api/satellite';
import { ADD_EPOCHS_ACTION_TYPE } from '../constants/action-types';

export interface TestState {
   contents: Record<string, Publication>;
   publications: Publication[];
   epochs: Epoch[];
}

const initialState: TestState = {
   contents: [],
   publications: [],
   epochs: [],
};

export function rootReducer(state = initialState, action: ActionUnion): TestState {
   if (action.type === NORMALIZE_PUBLICATION_LIST) {
      return { ...state, publications: [...action.data.publications] };
   } else if (action.type === PUBLICATION_COMPLETE) {
      return {
         ...state,
         contents: { ...state.contents, [action.data.publication.uuid]: action.data.publication },
      };
   } else if (action.type === ADD_EPOCHS_ACTION_TYPE) {
      return { ...state, epochs: [...action.data.epochs] };
   } else if (action.type === '') {
      return { ...state, epochs: [...action.data.epochs] };
   }

   return state;
}
