import { ActionUnion, NORMALIZE_PUBLICATION_LIST, PUBLICATION_COMPLETE } from '../actions';
import { Epoch } from '../api/satellite';
import { Publication } from '../api/satellite';
import { ADD_EPOCHS_ACTION_TYPE } from '../constants/action-types';
import { FILTER_PUBLICATIONS_ACTION_TYPE } from '../constants/action-types';

export interface GlobalState {
    contents: Record<string, Publication>;
    publications: Publication[];
    epochs: Epoch[];
    searchTerms: string[];
}

const initialState: GlobalState = {
    contents: {},
    publications: [],
    epochs: [],
    searchTerms: []
};

export function rootReducer(state = initialState, action: ActionUnion): GlobalState {
    if (action.type === NORMALIZE_PUBLICATION_LIST) {
        return { ...state, publications: [...action.data.publications] };
    } else if (action.type === PUBLICATION_COMPLETE) {
        return {
            ...state,
            contents: { ...state.contents, [action.data.publication.uuid]: action.data.publication }
        };
    } else if (action.type === ADD_EPOCHS_ACTION_TYPE) {
        return { ...state, epochs: [...action.data.epochs] };
    } else if (action.type === FILTER_PUBLICATIONS_ACTION_TYPE) {
        return {
            ...state,
            searchTerms: action.payload
        };
    }

    return state;
}
