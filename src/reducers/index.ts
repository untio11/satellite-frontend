import { testAction, TestActionType } from "../actions";
import {TEST_TYPE} from "../constants/action-types";

export interface TestState {
    contents: string[];
};

const initialState: TestState = {
    contents: []
}

export function rootReducer(state = initialState, action: TestActionType): TestState {
    if (action.type == TEST_TYPE) {
        return {...state, contents: [...state.contents, action.payload.content]};
    }
    return state;
}