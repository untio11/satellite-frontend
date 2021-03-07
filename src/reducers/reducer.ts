import { Action } from '../actions/sayHello';

const reducer = (state = {}, action: Action) => {
    switch (action.type) {
        case 'HELLO_REACT':
            return {...state, say: 'Hello World Redux'};
        default:
            return state;
    }
};

export default reducer;