# Note: Section 19: Connecting Bundles in Redux

*BundlingプロセスはどのようにReducerに追加されるのだ？のような問いは、最終的にselectorを使うべきか使わざるべきかの議論になる。*

今２種類のプロパティをRedux stateは抱えている。

`data`とそれ以外である。

`data`はバンドリングプロセスの結果を保存するオブジェクトで、

今いくつのセルがあるのかに依存するプロパティでもある。

`bundles`は`{ [cell id]: Bundle }`を抱えることになるので

`bundles`は技術的に`cells`の派生stateになる、とのこと。



こんなときどうしたらbundlesはシンプルに設計できるか。

```TypeScript
// state/reducers/cellReducers.ts
interface CellsState {
  loading: boolean;
  error: string | null;
  order: string[];
  data: {
    [key: string]: Cell;
  };
}
```
案１ sekector (useSelector等のredux stateを取得、検索する仕組み)を使って見る方法：

非同期の計算を実現させるのが困難であるため使用しないほうがいい。

そもそもセレクタはパフォーマンスの向上のために同じ引数からなる計算はスキップされる可能性がある。

案２ selectorを使わない非同期処理を実装する方法

バンドルリクエストを送信して、バンドル結果を待ち、バンドル結果をRedux stateへ保存する方法



#### [自習]Redux Selector

https://redux.js.org/usage/deriving-data-selectors

Selectorとは：

**`selector`関数はRedux-stateを引数として受け付け、stateに基づくデータを返す関数のことである**

selectorとはReduxのstateからデータを取得する仕組みで、パフォーマンスが最適化されている。

## Plan to connect Bundles to Redux

これから実装しようとしていることの図：

```
┌───────── Redux Store ──────┐
│                            │
│          ┌──> data   ────────┐
│ cells ───┥                 │ ├─────>　CellList
│          └──> order  ────────┘           │
│                            │             │
│                            │        ┌────┴────┐
│                           CellListItem        CellListItem
│                            │        │         │
│         ┌──────────────────> CodeCell         CodeCell
│         │                  │        │         │
│         │         Code unchanged for 750ms?   Code unchanged for 750ms?
│         │                  │        │         │
│         │       BundleCell Action Creator     BundleCell Action Creator 
│         │                  │        │                   │
│         │                  │        ├ BUNDLE_START      │
│         └────────────┐     │        ├ BUNDLE_COMPLETE   │
│                      │     │        │                   │
│ bundles ────> data ──┘     │        │                   │
└──────────────── ^ ─────────┘        │                   │
                  └───────────────────┴───────────────────┘
```

つまり、

- `CellListItem`のレンダリング時に`data`を取得してレンダリングする
- ユーザがエディタを編集してそれ以上の入力が750ms以上なかったらbundleのアクションクリエータを生成する
- それをディスパッチしてバンドリングプロセスを多分reducerが実行させる
- 処理時間が長かったらローディング画面を設けることにする
- バンドリング完了したら完了を示すアクションをディスパッチする
- バンドリングした結果をRedux Storeへ上書きする
- `CodeCell`は更新を受け取り再レンダリングする


## Defining Bundling Action types

```TypeScript
export enum ActionType {
    MOVE_CELL = 'move_cell',
    DELETE_CELL = 'delete_cell',
    INSERT_CELL_AFTER = 'insert_cell_after',
    UPDATE_CELL = 'update_cell',

    // NOTE: new added.
    BUNDLE_START = 'bundle_start',
    BUNDLE_COMPLETE = 'bundle_complete'
}

// actions/index.ts

export interface BundleStart {
  type: ActionType.BUNDLE_START,
  paload: {
    cellId: string;
  };
}

export interface BundleComplete {
  type: ActionType.BUNDLE_COMPLETE,
  payload: {
    cellId: string;
    bundle: {
      code: string;
      err: string;
    }
  };
}

export type Action =
  | MoveCellAction
  | DeleteCellAction
  | InsertCellAfterAction
  | UpdateCellAction
  | BundleStart
  | BundleComplete;
```

Reducer:

`BUNDLE_START`, `BUNDLE_COMPLETE`のディスパッチに対応

```TypeScript
// NOTE: `immer`で直接stateを変更する分をかけているが内部的には必ず上書きであるので注意
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

const reducer = produce(
    (state: BundleState = initialState, action: Action): BundleState => {
        switch(action.type) {
            case ActionType.BUNDLE_START:
                state[action.payload.cellId] = {
                    loading: true,
                    code: '',
                    err: ''
                };
                return state;
            case ActionType.BUNDLE_COMPLETE:
                state[action.payload.cellId] = {
                    loading: false,
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
```

#### Redux: 新しいReducerを追加する

```TypeScript
import { combineReducers } from 'redux';
import cellsReducer from './cellsReducer';
import bundleReducer from './bundlesReducer';

// NOTE: 新しいReducerは常にここについかすること
const reducers = combineReducers({
    cells: cellsReducer,
    bundles: bundleReducer  // 今回追加。
});

export default reducers;

// NOTE: ここで`RootState`をエクスポートしておくと、
// Reduxのselectorに渡すときに便利
export type RootState = ReturnType<typeof reducers>;
```

`bundlesReducer.ts`にて`bundleState`インタフェイスが定義されており、

これもコンバインされるため、自動的に`RootState`へ追加されている


#### `CodeCell`へバンドリングアクションの導入

Reduxでバンドリングプロセスを実行することになったので`CodeCell`をリファクタリング

直接bundle()を呼び出す代わりにbundleアクションを呼び出す

バンドルされたコードはuseTypedSelector()を使って取得することにする

```TypeScript
import { useEffect } from 'react';
import CodeEditor from './code-editor';
// import Preview from './preview';
import Resizable from './resizable';
import { Cell } from '../state';
import { useActions } from '../hooks/use-actions';
import { useTypedSelector } from '../hooks/use-typed-selector';

interface CodeCellProps {
  cell: Cell;
}

const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  const { updateCell, createBundle } = useActions();
  // バンドル結果を取得する仕組み
  const bundle = useTypedSelector((state) => state.bundles[cell.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // バンドルアクションを発行する仕組み
      createBundle(cell.id, cell.content);
    }, 750);

    return () => {
      clearTimeout(timer);
    };
  }, [cell.content, cell.id]);

  return (
    <Resizable direction="vertical">
      <div
        style={{
          height: 'calc(100% - 10px)',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Resizable direction="horizontal">
          <CodeEditor
            initialValue={cell.content}
            onChange={(value) => updateCell(cell.id, value)}
          />
        </Resizable>
        {/* <Preview code={code} err={err} /> */}
      </div>
    </Resizable>
  );
};
```

アプリケーションマウント直後に実行されるハードコーディングされている`store.dispatch()`で生成されたCellはundefinedになる可能性がある

#### `bundleState`が`undefined`をとりうるようにする

`undefined`は必ずなりうるようにする。

そうしないとマウント時に必ずエラーを起こす。

後で次の二つの場合にロードスピナを表示することにする。

1. bundleがない場合（undefinedの場合も？）
2. BundleState.loadingがtrueの時

```TypeScript
// bundlesReducer.ts

interface BundleState {
  [key: string]: {
    code: string;
    err: strong;
    loading: boolean;
  }
  // NOTE: new added
  | undefined
}
```

さてこうするとTypeScript的にBundleStateの変数が全てundefinedになりうると認識される

```TypeScript
// code-cell.tsx

// ...

const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  // ...

  return (
    <Resizable direction="vertical">
      <div
        style={{
          height: 'calc(100% - 10px)',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Resizable direction="horizontal">
          <CodeEditor
            initialValue={cell.content}
            onChange={(value) => updateCell(cell.id, value)}
          />
        </Resizable>
        // NOTE: Error: bundle is possibly undefined.
        <Preview code={bundle.code} err={bundle.err} />
      </div>
    </Resizable>
  );
};

// こうする: undefinedならpreviewを表示しない

    {bundle && <Preview code={bundle.code} err={bundle.err} />}

```
#### エラー：`React Hook useEffect has a missing dependency: 'createBundle'.`

@code-cell.tsx:

`React Hook useEffect has a missing dependency: 'createBundle'.`

なぜこんなエラーが起こるのか：

`useEffect()`の中身のコードが依存する変数を参照しているのにも関わらず、その変数が依存配列に含まれていないからである。

詳しくは`./Synchronizing-with-Effects.md`に。

#### `useMemo`: 依存配列に含まれていない警告の解消

くたばれWindos!!!!!!!!