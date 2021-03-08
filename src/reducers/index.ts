import { ActionUnion } from '../actions';
import { SignedContent } from '../api/satellite';
import { ADD_PUBLICATION_ACTION_TYPE } from '../constants/action-types';

export interface TestState {
   contents: SignedContent[];
}

const initialState: TestState = {
   contents: [],
};

export function rootReducer(state = initialState, action: ActionUnion): TestState {
   if (action.type === ADD_PUBLICATION_ACTION_TYPE) {
      return { ...state, contents: [...state.contents, ...Object.values(action.payload)] };
   }
   return state;
}
