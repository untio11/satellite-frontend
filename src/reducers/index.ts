import { ActionUnion, NORMALIZE_PUBLICATION_LIST, PUBLICATION_COMPLETE } from '../actions';
import Publication from '@satellite-earth/publication';

export interface TestState {
   contents: Record<string, Publication>;
   publications: Publication[];
}

const initialState: TestState = {
   contents: [],
   publications: [],
};

export function rootReducer(state = initialState, action: ActionUnion): TestState {
   if (action.type === NORMALIZE_PUBLICATION_LIST) {
      return { ...state, publications: [...action.data.publications] };
   } else if (action.type === PUBLICATION_COMPLETE) {
      return {
         ...state,
         contents: { ...state.contents, [action.data.publication.uuid]: action.data.publication },
      };
   }

   return state;
}
