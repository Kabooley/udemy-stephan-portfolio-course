import produce from 'immer';
import { ActionType } from '../action-types';
import { Action } from '../actions';

interface BundleState {
    [key: string]: {
        code: string;
        loading: boolean;
        err: string;
    }
};

const initialState: BundleState = {};

const reducer = produce((state: BundleState = initialState, action: Action): BundleState => {
    switch(action.type) {
        case ActionType.BUNDLE_START:
            state[action.payload.cellId] = {
                // NOTE: バンドリングプロセスが開始なのでtrue
                loading: true,
                // 初期値
                code: '',
                err: ''
            };
            return state;
        case ActionType.BUNDLE_COMPLETE:
            state[action.payload.cellId] = {
                // NOTE: バンドリングプロセスが終了なのでfalse
                loading: false,
                // バンドル結果はディスパッチで与えられる
                code: action.payload.bundle.code,
                err: action.payload.bundle.err
            };
            return state;
        default: 
            return state;
    };
},
    // NOTE: To avoid error
    initialState
);

export default reducer;
