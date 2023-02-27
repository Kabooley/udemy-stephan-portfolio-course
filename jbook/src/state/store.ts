// NOTE: `createStore` is now deprecated. But use it however.
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';


import { ActionType } from './action-types';


export const store = createStore(reducers, {}, applyMiddleware(thunk));

// QUICK TEST:

store.dispatch({
    type: ActionType.INSERT_CELL_BEFORE,
    payload: {
        id: 'sdsajd',
        type: 'code'
    }
});

store.dispatch({
    type: ActionType.INSERT_CELL_BEFORE,
    payload: {
        id: 'jjjj',
        type: 'text'
    }
});

store.dispatch({
    type: ActionType.INSERT_CELL_BEFORE,
    payload: {
        id: 'kkkkk',
        type: 'code'
    }
});

console.log(store.getState());