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

...

とはいえなぜ`createBundle()`が警告に出るのか？

```TypeScript
  useEffect(() => {
    const timer = setTimeout(async () => {
      createBundle(cell.id, cell.content);
    }, 750);

    return () => {
      clearTimeout(timer);
    };
  }, [cell.content, cell.id]);
```

createBundle()の結果はuseEffect内部のコードに影響しないはずでは？

どうやって影響するかどうか判断すればいいだろうか。


#### `useMemo`: 依存配列に含まれていない変数があるよの警告の解消

`useEffect`の依存変数が起こす問題を解決するために`useMemo`を導入する好例：

`createBundle()`を依存関係に追加したところ、

useEffect()が何度も不要に呼び出され無限ループに陥っている模様。

原因は間違いなく`createBundle()`のせいで、レンダリングの後に毎度`createBundle()`が変更しているらしいからだ。

毎レンダリング時に`createBundle()`が別物になっていると判断されるらしい。

とはいえ`createBundle()`は`useEffect()`の依存関係なのでその依存配列から取り出すわけにはいかない。

```bash
# こんな調子で無限ループになる
# 結構なスピードで発生する
# 
# 毎度同じ出力が2度起こるのは開発モードの仕様である
[CodeCell] setTimeout()
23:09:26.986 index.ts:63 [createBundle()]
23:09:27.007 code-cell.tsx:24 [CodeCell] setTimeout()
23:09:27.007 index.ts:63 [createBundle()]
23:09:27.007 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.007 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.008 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.009 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.017 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.018 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.018 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.021 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.066 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.066 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.067 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.067 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.078 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.078 code-cell.tsx:32 [CodeCell] clear setTimeout()
23:09:27.079 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.080 code-cell.tsx:19 [CodeCell] useEffect()
23:09:27.843 code-cell.tsx:24 [CodeCell] setTimeout()
```

そのため、`createBundle()`が毎度新しく生成されないように毎回同じ`createBundle()`を提供するようにする。

ということで、初期レンダリング時に`createBundle()`を「固定」して、それ以降変更されないようにする。

```Typescript
// hooks/use-actions.ts
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../state';

export const useActions = () => {
    const dispatch = useDispatch();

    return useMemo(() => {
        return bindActionCreators(actionCreators, dispatch);
    }, [dispatch]);
};
```

上記のコードだと`useMemo()`を直接返すので、

初期レンダリング時にuseActions()は一度`bindActionCreators()`を実行しその値を返し、

以降、`dispatch`の内容に変更があった時だけ、bindActionCreators()を再度実行させ、その計算結果を返す。

これで毎回`createBundle()`が新しく生成されるのを防ぐ。

まとめ：

- `useEffect()`にはその内部コードが依存する変数はすべて依存配列に含めなくてはならない
- とはいえ、依存関係がそのuseEffect外部の関数だと毎度別物と判断されることがあるので無限ループに陥る
- `useMemo()`を使って依存関係の関数を「固定」する

#### Eager Bundleの追加

追加できる改善その一。

「アプリケーションをリロードすると初期レンダリング時にプレビューが点滅する」問題の解消。

こうなる流れ：

- Appリロード
- CodeCellsの(ハードコーディングされた)生成アクションのディスパッチ
- stateが更新されて2つの`CodeCell`が表示される
- 各`CodeCell`で`useEffect()`が呼び出されて、750ms後に発動する関数がセットされる
- 750ms経ち、`createBundle()`が呼び出されてコードがバンドルされる
- バンドルコードを受け取りpreview画面に出力される

この間、preview画面には何も表示されない

コンポーネントの出力は次の`{bundle && <Preview />}`という条件分岐にしているから。

つまり、

リロードしただけなので、previewコンポーネントはバンドル結果を待つ必要性はないのであるが、現状待っているために、preview画面は少し奇妙な表示をすることになってしまっているのである。

これの解消。

解決策：「ユーザが実際にCellに変更を加えたときだけ、再バンドルを試みる」という仕様に変更する。

 
もしも`bundle`がundefinedなら`setTimeout`抜きで即座に`createBundle()`を呼び出す。

```TypeScript
// code-cell.tsx

  const { updateCell, createBundle } = useActions();
  const bundle = useTypedSelector((state) => state.bundles[cell.id]);

  useEffect(() => {
    // NOTE: add this conditional.
    if(!bundle) {
        createBundle(cell.id, cell.content);
        return;
    }

    const timer = setTimeout(async () => {
      createBundle(cell.id, cell.content);
    }, 750);

    return () => {
      clearTimeout(timer);
    };
    // NOTE: Shut the eslint up
    // 
  }, [cell.content, cell.id, createBundle]);

```

これで点滅しなくなった。

ただし、次の問題。

`bundle`変数がuseEffect()の新たな依存変数になるので、依存配列に含めるようにしなくてはならなくなった。

今回はeslintを黙らせる方向で解決することにした見たい。

## Showing Loading Message 

ユーザ入力コードが変換中である時間に表示するローディング画面を実装する。

```TypeScript
interface bundle {
    loading: boolean;   // ローディング判定地
    code: string;
    err: string;
} | undefined;
```

今のところすでにloadingの実装は済んでいるのであとは表示するだけ。

```TypeScript
// code-cell.ts

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
        // NOTE: new added this conditional.
        {
            !bundle || bundle.loading
            ? <div>Loading...</div>
            : <Preview code={bundle.code} err={bundle.err} />
        }
      </div>
    </Resizable>
  );
```

#### styling loading process bar

HTMLの`progress`タグを設ける。

```TypeScript
// code-cell.ts
import './code-cell.css';

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
        // NOTE: new added this conditional.
        {
            !bundle || bundle.loading
            ? <div className="progress-cover">
                <progress className="progress is-small is-primary" max="100" >
                    Loading
                </progress>
              </div>
            : <Preview code={bundle.code} err={bundle.err} />
        }
      </div>
    </Resizable>
  );
```

```css
/* code-cell.css */
.progress-cover {
    height: 100%;
    flex-grow: 1;
    background-color: white;
    display: flex;
    align-items: center;
    padding-left: 10%;
    padding-right: 10%;
}
```

プログレスバーが表示されるようになった。

しかし、現状だとユーザがエディタに変更を加えて、手をわずかに止め、また変更を加えるというような操作をすると

プレビュー画面に一瞬何かが移って消えるみたいな表示が繰り返されるため、

ユーザを混乱させる原因になりかねない。

そのためローディング画面の表示は、バンドルにかかる時間が長くなると予想したときにのみ表示するようにする。

#### Bundleにかかる時間の見積もり

いつプログレスバーを表示するべきか

- ユーザが入力したコードをバンドルするのにかかる時間はわからない
  とはいえ、
- importなしのJSコードならおそらくめちゃ早いだろう
- importありだと時間はかかるだろう
- 2秒以上かかるバンドルだったら、そのバンドルプロセスはきっと長時間かかるだろう

という推測は概ね外れないだろうということで、見積もりを出すための複雑なJSコードを書くよりも簡単な解決策を採用しよう。

次のようにする。

> そこで、アニメーションに少し時間をかけることにします。プログレスバーを表示するときはいつでも、プログレスバーの容量を徐々に変化させ、時間をかけて送り込むことにします。つまり、非常に優しく、非常にゆっくりとフェードインしていくのです。これは、このルールを考慮したもので、「長くなればなるほど、長いバンドリングの試みになる可能性が高くなる」と言うことです。だから、プログレスバーを表示したいのです。そこで、この説明文は最も効果的なものではないので、一番いいのは、非常に素早く休憩して、次のビデオに戻って、トランジションやアニメーションをちょっとだけ入れてみることです。そして、この仮定が実際にかなりの数のケースでうまく機能することがすぐにわかると思います。

うんわからん。実際にハンズオンで理解しよう。

#### Animation: Fading in the Progress bar

プログレスバーをフェードイン・フェードアウトするためのアニメーションを設ける。

