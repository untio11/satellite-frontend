import { createSelector } from 'reselect';
import { Publication } from '../api/satellite';
import { GlobalState } from '../reducers';
const searchTermSelector = (state: GlobalState) => state.searchTerms;
const publicationSelector = (state: GlobalState) => state.publications;

export const postSelector = createSelector(
   searchTermSelector,
   publicationSelector,
   (searchTerms: string[], publications: Publication[]) => {
      if (searchTerms.length === 0) return publications;
      return publications.filter((pub) => {
         for (const term of searchTerms) {
            const title = (pub._signed_.title || '').toLocaleLowerCase();
            const subtitle = (pub._signed_.subtitle || '').toLocaleLowerCase();
            const termLow = term.toLocaleLowerCase();

            if (title.includes(termLow) || subtitle.includes(termLow)) {
               return true;
            }
         }
         return false;
      });
   }
);
