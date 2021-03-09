import { createSelector } from 'reselect';
import { Publication } from '../api/satellite';
import { GlobalState } from "../reducers"
const searchTermSelector = (state: GlobalState) => state.searchTerms;
const publicationSelector = (state: GlobalState) => state.publications;

export const postSelector = createSelector(
    searchTermSelector,
    publicationSelector,
    (searchTerms: string[], publications: Publication[]) => {
        if (searchTerms.length === 0) return publications;
        return publications.filter((pub) => {
            for (const term of searchTerms) {
                if (pub._signed_.title.toLowerCase().includes(term.toLocaleLowerCase()) ||
                pub._signed_.subtitle.toLowerCase().includes(term.toLowerCase())) {
                return true;
                }
            }
           return false;
        });
    }
);