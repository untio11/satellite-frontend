import { ActionUnion, NORMALIZE_PUBLICATION_LIST } from '../actions';
import { SignedContent } from '../api/satellite';
import Publication from '@satellite-earth/publication';

export interface TestState {
   contents: SignedContent[];
   publications: Publication[];
}

const initialState: TestState = {
   contents: [],
   publications: [],
};

export function rootReducer(state = initialState, action: ActionUnion): TestState {
   if (action.type === NORMALIZE_PUBLICATION_LIST) {
      return { ...state, publications: [...action.data.publications] };
   }

   return state;
}
