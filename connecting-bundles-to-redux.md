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


## Defining Bundlign Action types

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

```TypeScript

```