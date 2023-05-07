# Note: Section 16 & 17

- Design Patterns for Redux with TypeScript
- Simplify state updates with Immer

*Reduxの導入*

NOTE: 講義中のreduxインストールコマンドはもはや使えないので以下を入力すること

```bash
$ npm install --save-exact react-redux redux @types/react-redux redux-thunk@2.3.0 --legacy-peer-deps
$ yarn add react-redux redux @types/react-redux redux-thunk@2.3.0 --legacy-peer-deps --exact
```

何のために導入するのか：

- 各コンポーネントが独自に管理する状態を一元管理するため

```bash
# redux store process image

        // Action Creators //

        - updateCell
        - deleteCell
        - insertCellBefore/After
        - moveCell
        - fetchCells

        // Redux Store //

        ┌────> data     # Array of all cells
        ├────> loading  # True/false whether we arer fetching data
cells ──┥
        ├────> error    # Errors related ot saving clells
        └────> order    # Order of cells

bundles  ───> data  # Bundle for each cell
```

## Cellの内容

reduxのstateで管理することになるデータの中身は？

アプリケーションの現在開かれているエディタやエディタに入力された内容である。

```TypeScript
// cellsReducer.ts
interface CellState {
    loading: boolean;
    error: string | null;
    order: string[];
    data: {
        [key: string]: Cell
    }
};

const initialState: CellState = {
    loading: false,
    error: null,
    order: [],
    data: {}
};

// Sample Data
{
    loading: false,
    error: null,
    data: {
        'adsdfsa': {
            id: 'adsdfsa',
            type: 'code',
            content: 'const a = 1'
        },
        'dfsasd': {
            id: 'dfsasd',
            type: 'code',
            content: 'const a = 1'
        },
        'gjeifn': {
            id: 'gjeifn',
            type: 'text',
            content: '# Note: about section 11'
        },
    }
}
```

## redux基礎

*基本を学ぼうじゃなくて、アプリケーションの基礎を作るという意味*

今のアプリケーションにreduxを導入する

```TypeScript
// src/index.tsx
import 'bulmaswatch/superhero/bulmaswatch.min.css';
import ReactDOM from 'react-dom';
// NOTE: Providerと、予め用意したstoreを取り込んで...
import { Provider } from 'react-redux';
import { store } from './state';
import TextEditor from './components/text-editor';

const App = () => {
  return (
    // アプリケーションにラップする
    <Provider store={store}>
      <div>
        <TextEditor />
      </div>
    </Provider>
  );
};

ReactDOM.render(<App />, document.querySelector('#root'));
```
```TypeScript
// state/store.ts
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';

export const store = createStore(reducers, {}, applyMiddleware(thunk));
```

```TypeScript
// reducer
// state/cellReducer.ts
import { ActionType } from '../action-types';
import { Action } from '../actions';
import { Cell } from '../cell';

interface CellState {
    loading: boolean;
    error: string | null;
    order: string[];
    data: {
        [key: string]: Cell
    }
};

const initialState: CellState = {
    loading: false,
    error: null,
    order: [],
    data: {}
};

const reducer = (state: CellState = initialState, action: Action): CellState => {
    switch(action.type) {
        case ActionType.UPDATE_CELL:
            return state;
        case ActionType.DELETE_CELL:
            return state;
        case ActionType.MOVE_CELL:
            return state;
        case ActionType.INSERT_CELL_BEFORE:
            return state;
        default:
            return state;
    }
};

export default reducer;
```

## Reducerでcellはこんな感じに更新される

```TypeScript
// cellsReducer.ts

const reducer = (state: CellState = initialState, action: Action): CellState => {
    switch(action.type) {
        case ActionType.UPDATE_CELL:
            const { id, content } = action.payload;
            return {
                ...state,
                data: {
                    ...state.data,
                    [id]: { 
                        ...state.data[id], 
                        content: content
                    }
                }
            };
        case ActionType.DELETE_CELL:
            return state;
        case ActionType.MOVE_CELL:
            return state;
        case ActionType.INSERT_CELL_BEFORE:
            return state;
        default:
            return state;
    }
};

export default reducer;
```

## [自習]　Reduxを導入するとどう変わる？

基礎と導入前と導入後の比較。何がよくなるの？

Maximillianのコースで復習

https://www.udemy.com/course/react-the-complete-guide-incl-redux/learn/lecture/25600128#content

#### What is Cross-Component/App-Wide state?

- local state: 単独のコンポーネントが保持するstate
- Cross-Component state: 複数のコンポーネントへ影響するようなstate
- Wide-App state: アプリケーション全体にかかわるstate

#### React-Contextって？: 

https://codesandbox.io/s/zealous-dew-0boovt?file=/src/index.ts

> Contextはpropsをあらゆるレベルへ届けるための各コンポーネントでバケツリレーさせる必要がない、コンポーネントツリーを通じてデータを伝達させることができる仕組みである

Reduxと何が違うの？:

https://stackoverflow.com/a/49569183

> `Context`はもはや実験的な機能ではなくなり、アプリケーションの深くネストされたコンポーネントへデータを直接送り届けるための素晴らしい手段です。

> Mark Erikson said...

> 「propsを下層へ送り届けるためにReduxを利用している場合、contectはreduxの代わりになるでしょう。しかしそもそも貴方はその時点でReduxが不要だったかもしれません。」

> 「また、Context は、Redux DevTools、状態の更新を追跡する機能、集中化されたアプリケーション ロジックを追加するミドルウェア、および Redux が可能にするその他の強力な機能のようなものも提供しません。」

> ReduxはContext　APIが持つ機能よりも強力でより多くの機能を提供するものです。

> Reduxは内部的にcontextを利用しているがそのことはAPIに現れていないので安心して間接的に使えるcontextともいえる。

#### How to use Redux?

Reduxは：

アプリケーションの中央にただ一つのstateをもち、すべてそのstateにデータをストアする

Reduxはcomponentを購読する。

componentはreduxのstateを直接操作するのではなくて、reducer(遅延させるもの)を通してデータを更新する

componentは新しいまたは更新されたデータをディスパッチして、

ディスパッチされたデータはreducerへ送信される

reducerは送られてきたデータを決められた処理を施しstateのデータを更新するかする。

- 純粋関数でなくてはならない(副作用があってはならないということ)
- 古いstateとディスパッチされたアクションを組み合わせた新しいstateオブジェクトを生成する（保管しているstateを直接変更するわけではないということ）

#### Quick Redux demo

```JavaScript
import redux from 'redux';

const initialState = {
    counter: 0
};

// reducer: ディスパッチされたactionと現在のstateを引数に取ってそれ等を処理した結果のあらたなstateを返す。
// 
// counterReducerの初期化の時にstateがundefinedにならないように
// デフォルト引数で初期値を登録しておく
const counterReducer = (state = initialState, action) => {

    // actionのtypeに応じて切り替える
    if(action.type === 'increment') {
        return {
            counter: state.counter + 1,
        };
    }
    return state;
};

// store
// 
// stateを保存してあるstoreにreducerを登録する
// そうするとactionがディスパッチされたときに登録したreducerが実行される
const store = redux.createStore(counterReducer);

// Subscriber
const counterSubscriber = () => {
    const lateState = store.getState();
    console.log(latestState);
};

// storeの変化を観測する
store.subscribe(counterSubscriber);

// actionをディスパッチする
store.dispatch({type: 'increment'});
```

## Section 17: Immerを使ってstateの更新を容易にする

https://immerjs.github.io/immer/

> `Immer`は不変なデータ構造を採用するあらゆるコンテキストに於いて利用することができる
> 不変のデータ構造により、(効率的な) 変更検出が可能になります。オブジェクトへの参照が変更されていない場合、オブジェクト自体は変更されていません。さらに、複製は比較的安価になります。データ ツリーの変更されていない部分はコピーする必要がなく、同じ状態の古いバージョンとメモリ内で共有されます。

Immerを導入する理由:

現状cellを更新すると2つのstateプロパティを変更することになる。

`order`と`data`の両方。

複雑になる。

orderはcellの順番で、dataは各cellの内容である。

Reduxは常に新しいstateを返す必要がある。

この複雑な更新はImmerというパッケージを使えば丸投げできる。

本来複雑にネストされたオブジェクトの特定の階層のプロパティを変更するためには

慎重で難読なコードを書かなくてはならない。

使い方は以下のようにreducerをimmerのproduce()関数でラップすること。

```TypeScript
// cellsReducer.ts

import { produce } from 'immer';
// ...

const reducer = produce(
    // 戻り値の型注釈も必要なくなる
    (state: CellState = initialState, action: Action) => {
    switch(action.type) {
        case ActionType.UPDATE_CELL:
            const { id, content } = action.payload;
            // NOTE: This gonna change to...
            // 
            // return {
            //     ...state,
            //     data: {
            //         ...state.data,
            //         [id]: { 
            //             ...state.data[id], 
            //             content: content
            //         }
            //     }
            // };
            // 
            // Like this.
            // 要は直接変更の命令を書くことができる
            state.data[id].content = content;
            // なにも変更しないなら
            return;
        case ActionType.DELETE_CELL:
            return state;
        case ActionType.MOVE_CELL:
            return state;
        case ActionType.INSERT_CELL_BEFORE:
            return state;
        default:
            return state;
    }
});
```

上記のように、要は`state.data[id].content`だけを更新するために

それ以外が変更されないよう面倒な処理を施すため長ったらしくなるが

immerを使えば変更したい部分を直接変更する命令を書いていい。

immerが代わりに面倒を引き受けてくれる。

#### `DELETE_CELL`の実装

cell stateの`order`と`data`の両方を変更する必要があるアクションのDELETE_CELLのreducerを実装する

```TypeScript
// cellsReducer.ts

const reducer = produce(
    (state: CellState = initialState, action: Action) => {
    switch(action.type) {
        case ActionType.UPDATE_CELL:
            const { id, content } = action.payload;
            state.data[id].content = content;
            return;
        case ActionType.DELETE_CELL:
            // payloadに削除対象のidが含まれている。
            delete state.data[action.payload];
            state.order = state.order.filter((id) => id !== action.payload);
            return;
        case ActionType.MOVE_CELL:
            return state;
        case ActionType.INSERT_CELL_BEFORE:
            return state;
        default:
            return state;
    }
});
```

#### `MOVE_CELL`他の実装

割愛

## TypeScript: produce()の戻り値の型

今のところ、`state`はundefinedをとりうるとなる。

undefinedはとらないので型情報を付与しなくてはならない。

とはいえ今のところ問題ではなく、TypeScriptのコンパイラを満足させるためだけなので

割愛

## Reducerの簡易テスト

フレームワークなし。

- 開発サーバを再起動
- 次を追加。要は実際にactionをディスパッチするだけ

```TypeScript
// store.ts
import { ActionType } from './action-types';

store.dispatch({
    type: ActionType.INSERT_CELL_BEFORE,
    payload: {
        id: null,
        type: 'code'
    }
});

store.getState();
```
あとはその処理のされ方を確認するだけ