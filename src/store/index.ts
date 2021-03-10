import { applyMiddleware, createStore } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { ActionUnion } from '../actions';
import { GlobalState, rootReducer } from '../reducers';

const store = createStore(rootReducer, applyMiddleware(thunk));
export default store;

export type RootState = ReturnType<typeof rootReducer>;
export type TypedThunkDispatch = ThunkDispatch<GlobalState, void, ActionUnion>;
