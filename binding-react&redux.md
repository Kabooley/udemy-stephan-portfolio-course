# Note: Section 18: Binding React and Redux


Redux を React に統合します

```bash
$ cd jbook/src/components
$ touch cell-list.tsx cell-list-item.tsx
```

それぞれセルの一覧と、セル自身をラップするコンポーネントである

ひとまず骨組みを作る

```TypeScript
// cell-list.tsx
const CellList: React.FC<> = () => {
  return <div></div>
};

export default CellList;

// cell-list-item.tsx
const CellListItem: React.FC<> = () => {
  return <div></div>
};

export default CellListItem;
```

```TypeScript
// index.tsx
import { CellList } from './components/cell-list'

const App = () => {
  return (
    <Provider store={store}>
      <div>
        // <TextEditor />
        <CellList />
      </div>
    </Provider>
  );
};
```

#### Redux: type selector を使う

```bash
$ cd jbook/src/
$ mkdir bundler/ hooks/
$ touch hooks/use-typed-selector.ts
```

```TypeScript
// use-typed-selectors.ts

import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState } from '../state';

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### what is `TypedUseSelectorHook`?

`useSelector`がわかるならば、

型情報付きの`useSelector`である。つまりTypeScript向けのReduxの機能である。

TypedUseSelectorHookは、その機能のオーバーライドを自分で定義する。

```TypeScript

```

TODO: ノートがあっちこっちにとっちらかっている。


const reducer = produce((state: CellsState = initialState, action: Action) => {
    ...
  }
}, initialState);

## `order`コンポーネントの配列へのマッピング

cellの順番を管理するorderコンポーネントの、その順番を抱える配列の要素をマッピングする処理の実装


## [Tips] ネストされたコンポーネントの依存関係を簡潔に保つために

各ディレクトリ（階層）にindex.tsを設けて、このindex.tsからのみその階層のコンポーネントすべてをexportできるように制限させる

```bash
src ───┬─── bundler/
       ├─── components/
       ├─── hooks/
       ├─── state/
       ├─── index.tsx
```

## 217 Cell Type Rendering

BEFORE:

```TypeScript
// cell-list.tsx
import { usedTypedSelector } from '../hooks/use-typed-selector';
import CellListItem from './cell-list-item';

const CellList: React.FC = () => {
    const cells = useTypedSelector(({ cells: { order, data }}) => order.map((id) => data[id]));

    const renderedCells = cells.map(cell => <CellListItem cell={cell} />);

    return <div>{renderedCells}</div>;
};

export default CellList;
```

```TypeScript
// cell-list-item.tsx
import { Cell } from '../state';

interface CellListItemProps {
    cell: Cell
};

const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
    return <div>{cell.id}</div>
};

export default CellListItem;
```

AFTER:

```TypeScript
// cell-list-item.tsx
import { Cell } from '../state';

interface CellListItemProps {
    cell: Cell
};

const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
    let child: JSX.Element;
    if(cell.type === 'code') {
        child = <CodeCell />;
    }
    else {
        child = <TextEditor />;
    };

    return <div>{child}</div>
};

export default CellListItem;
```

TEST:

```TypeScript
store.dispatch({
    type: ActionType.INCERT_CELL_BEFORE,
    payload: {
        id: null,
        type: 'code'
    }
});

store.dispatch({
    type: ActionType.INCERT_CELL_BEFORE,
    payload: {
        id: null,
        type: 'text'
    }
});
```

## 218: Reminder on Action Creator Helper

*Action Dispatchingの実装*

Reduxストアから情報を取得することができるようになった。

Reduxストアの情報を更新もできるようにする。

今、ユーザがテキストエディタを編集したり、コードエディタにコードを入力したら、

Reduxストアも更新されるようにする

--> action ディスパッチの実装をしていく

`use-typed-selector.ts`と同様に、useDispatch()のためのhooksコンポーネントを作成する

```TypeScript
// hooks/use-actions.ts
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../state';

export const useActions = () => {
    const dispatch = useDispatch();

    return bindActionCreators(actionCreators, dispatch);
};

// USAGE:
// const { updateCell } =  useActions();
// updateCell(/* action contents */);
```

```TypeScript
// state/index.ts
// NOTE: add this.
export * as actionCreators from './action-creators';
```

#### 219: Extracting local state

今作っている仕組み：

Redux store: Cellの情報

cell-list.tsx：Cellの配列が与えられて、Cell要素それぞれにセルリストアイテムを作成して、セルオブジェクトを渡す

cell-list-item.tsx:`CodeCell`または`TextEditor`を作成する

Reduxと接続できたので、CodeCell, TextEditorのローカルstateを除去していく

1. `Cell`を渡す

```TypeScript
// cell-list-item.tsx

const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
    let child: JSX.Element;
    if(cell.type === 'code') {
        // Added cell props
        child = <CodeCell cel={cell} />;
    }
    else {
        child = <TextEditor />;
    };

    return <div>{child}</div>
};
```

2. `CodeCell`は`Cell`を受け付けるようにする

```TypeScript
// code-cell.tsx
import { Cell } from '../state';
import { useActions } from '';

interface CodeCellProps {
    cell: Cell
};

const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
    // NOTE: Delete input useState()

    const { updateCell } = useActions(); 
    useEffect(() => {
        // ...
        // inputからcell.contentへ
        const output =  await bundle(cell.content);

    }, [cell.content]);

    return (
        <CodeEditor
            initialValue={cell.content}
            // setInput()をなくしてディスパッチ関数にする
            onChange={(value) => updateCell(cell.id, value)}
        />
    );
};
```

同様に、

```TypeScript
// text-editor.tsx
import './text-editor.css';
import { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Cell } from '../state';
import { useActions } from '../hooks/use-actions';

interface TextEditorProps {
  cell: Cell;
};


const TextEditor: React.FC<TextEditorProps> = ({ cell }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  // const [value, setValue] = useState('# Header');

  const { updateCell } = useActions();

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (
        ref.current &&
        event.target &&
        ref.current.contains(event.target as Node)
      ) {
        return;
      }

      setEditing(false);
    };
    document.addEventListener('click', listener, { capture: true });

    return () => {
      document.removeEventListener('click', listener, { capture: true });
    };
  }, []);

  if (editing) {
    return (
      <div className="text-editor" ref={ref}>
        <MDEditor value={cell.content} onChange={(v) => updateCell(cell.id, v || '')} />
      </div>
    );
  }

  return (
    <div className="text-editor card" onClick={() => setEditing(true)}>
      <div className="card-content">
        <MDEditor.Markdown source={cell.content || 'Click to edit'} />
      </div>
    </div>
  );
};

export default TextEditor;

```

## Action barの実装

```TypeScript
import { useActions } from '../hooks/use-actions';

interface ActionBarProps {
    id: string;
};

const ActionBar: React.FC<ActionBarProps> = ({ id }) => {
    const { moveCell, deleteCell } = useActions();

    return (
        <div>
            <button onClick={() => moveCell(id, 'up')} >UP</button>
            <button onClick={() => moveCell(id, 'down')} >DOWN</button>
            <button onClick={() => deleteCell(id)} >DELETE</button>
        </div>
    );
};

export default ActionBar;
```

これをcell-itemへ追加する

```TypeScript
// cell-list.tsx
import ActionBar from './action-bar';

const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
    // ...

    return (
        <div>
            // NOTE: add component
            <ActionBar id={cell.id} />
            {child}
        </div>
    );
};
```

#### Styling Action bar

アクションバーのスタイリング

`@fo**r**tawesome`を使う。

```bash
$ yarn add @fortawesome/fontawesome-free@5.15.1 --legacy-peer-deps
```

```TypeScript
// action-bar.tsx
const ActionBar: React.FC<ActionBarProps> = ({ id }) => {
    const { moveCell, deleteCell } = useActions();

    return (
        <div className="action-bar">
            <button className="button is-primary is-small" onClick={() => moveCell(id, 'up')} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
            <button className="button is-primary is-small" onClick={() => moveCell(id, 'down')} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
            <button className="button is-primary is-small" onClick={() => deleteCell(id)} >
                <span className="icon">
                    <i className="fas fa-arrow-up"></i>
                </span>
            </button>
        </div>
    );
};
```

```css
.action-bar {
    position: absolute;
}
```

で親コンポーネントを`position:relative`にする

これでスタイリングが採用されたアクションバーができた

#### アクションバーのバーを作成する

アクションボタンを載せたバーのこと。

```TypeScript
const CellListItem: React.FC<CellListItemProps> = ({ cell }) => {
    let child: JSX.Element;
    if(cell.type === 'code') {
      // NOTE: 下記のようにchildの中身をdivでラッピングしてそいつをアクションバーにする
        child = <>
            <div className="action-bar-wrapper">
                <ActionBar id={cell.id} />
            </div>
            <CodeCell cell={cell} />;
        </>
    }
    else {
        child = <>
            <div className="action-bar-wrapper">
                <ActionBar id={cell.id} />
            </div>
            <TextEditor cell={cell} />;
        </>
    };

    return (
        <div className="cell-list-item">
            {child}
            <ActionBar id={cell.id} />
        </div>
    );
};
```

## セル追加機能の実装

`AddCell`

こういうのを各セルの間に差し込む

```
  ─────[Code]────────[Text]───────────
```

押すとそこにcodeかtextエディタのセルを挿入する

各ボタンが押されたら、cell idに対してINSERT_CELL_BEFOREをディスパッチする

#### Add Cell出力

セル追加のコンポーネントの数は、

すべてのセルの上下に存在する数という考え方ではなく、

セルリストの数　＋　１にしたい。

次のようにすればよい：

- コンポーネント配列ではAddCellとCellListItemのペアを１要素とする
- デフォルトの出力で常に一番下にAddCellを出力するようにする

```TypeScript
import { useTypedSelector } from '../hooks/use-typed-selector';
import CellListItem from './cell-list-item';
import AddCell from './add-cell';

const CellList: React.FC = () => {
    const cells = useTypedSelector(({ cells: { order, data }}) => order.map((id) => data[id]));

    const renderedCells = cells.map(
        cell => (
        <>
            // NOTE: added AddCell
            <AddCell nextCellId={cell.id} />
            <CellListItem cell={cell} />
        </>);
    );

    console.log(renderedCells);

    return (
        <div>
            {renderedCells}
            // NOTE: always leave AddCell here.
            // ひとまずnullを渡すので関係コンポーネントでnullを受け付けるようにする
            <AddCell nextCellId={null} />
        </div>
    );
};

export default CellList;
```

#### `Fragment`を使った`key`プロパティ警告の解決

https://ja.reactjs.org/docs/fragments.html

`cell-list.tsx`で出力するコンポーネント配列に`AddCell`を追加したけどkeyプロップがまだついていない。

`Fragment`コンポーネントを使えば、

AddCellとCellListItemをdivで囲う必要なく余計な要素を出力せずにラッピングできる。

```TypeScript
import { Fragment } from 'react';

const CellList: React.FC = () => {
    // ...

    const renderedCells = cells.map(
        cell => (
            // Fragmentで囲って、CellListItemに渡していた
            // keyを代わりにFragmentへ渡す
        <Fragment key={cell.id} >
            <AddCell nextCellId={cell.id} />
            <CellListItem cell={cell} />
        </Fragment>);
    );

    return (
        // ...
    );
};
```

#### AddCell スタイリング

```TypeScript
import './add-cell.css';
import { useActions } from '../hooks/use-actions';

interface AddCellProps {
    nextCellId: string | null;
};

const AddCell: React.FC<AddCellProps> = ({ nextCellId }) => {
    const { insertCellBefore } = useActions();

    return (
        <div className="add-cell">
            <div className="add-buttons">
                <button 
                    className="button is-primary is-rounded is-small" 
                    onClick={() => insertCellBefore(nextCellId, 'code')}
                >
                    <span className="icon is-small">
                        <i className="fas fa-plus" />
                    </span>
                    <span>Code</span>
                </button>
                <button 
                    className="button is-primary is-rounded is-small" 
                    onClick={() => insertCellBefore(nextCellId, 'text')}
                >
                <span className="icon is-small">
                    <i className="fas fa-plus" />
                </span>
                <span>Text</span>
                </button>
            </div>
            <div className="divider"></div>
        </div>
    );
};

export default AddCell;
```
```css
.add-cell {
    position: relative;
    opacity: 0;
    transition: opacity 0.3s;
}

.add-cell:hover {
    opacity: 1.0;
}

.add-cell .divider {
    position: absolute;
    top: 50%;
    bottom: 50%;
    right: 5%;
    left: 5%;
    border-bottom: 1px solid gray;
    width: 95%;
    z-index: -1;
}

.add-buttons {
    display: flex;
    justify-content: center;
}

.add-cell .add-buttons button {
    margin: 0 20px;
}
```

#### CSSの条件分岐Tips

Cellがないときに`AddCell`を強制的に表示させる

今`AddCell`はマウスをホバーすると表示されるようになっている。

つまりアプリケーションがセルを表示していないまっさらな状態を表示しているとき、

`AddCell`が表示されないので、

まっさらな状態のときに何をすればいいのか不明なアプリに見えて困る。

なのでCellがひとつもないときは必ず`AddCell`を表示させるという条件をCSSに設けるにはどうするべきか

解決策１：`className`に条件分岐を設ける

```TypeScript
    return (
        <div>
            {renderedCells}
            <div className={cell.length === 0 ? 'force-visibile': ''}>
                <AddCell nextCellId={null} />
            </div>
        </div>
    );
```
解決策２：`style`propに条件分岐を設ける

```TypeScript
    return (
        <div>
            {renderedCells}
            <AddCell style={{ opacity: cell.length === 0 ? 1 : 0}} nextCellId={null} />
        </div>
    );
```

過剰なプロパティになる

解決策３： 表示するか非表示にするかのpropを渡す

```TypeScript
// cell-list.tsx
const CellList: React.FC = () => {
    // ...

    return (
      <div>
        {renderedCells}
        // NOTE: 表示非表示に関するプロパティを追加する
        <AddCell forceVisible={cells.length === 0} nextCellId={null} />
      </div>
    );
  };
  
export default CellList;

// add-cell.tsx

interface AddCellProps {
  nextCellId: string | null;
    // NOTE: add new prop
  forceVisible?: boolean;
}

const AddCell: React.FC<AddCellProps> = ({ forceVisible, nextCellId }) => {
  const { insertCellBefore } = useActions();

  return (
    // NOTE: added new prop
    <div className={`add-cell ${forceVisible && 'force-visible'}`}>
      <div className="add-buttons">
        <button
          className="button is-rounded is-primary is-small"
          onClick={() => insertCellBefore(nextCellId, 'code')}
        >
          <span className="icon is-small">
            <i className="fas fa-plus" />
          </span>
          <span>Code</span>
        </button>
        <button
          className="button is-rounded is-primary is-small"
          onClick={() => insertCellBefore(nextCellId, 'text')}
        >
          <span className="icon is-small">
            <i className="fas fa-plus" />
          </span>
          <span>Text</span>
        </button>
      </div>
      <div className="divider"></div>
    </div>
  );
};
```

#### 他スタイリング

割愛

## `AddCell`の奇妙な動作の修正


現状、`Code`追加ボタンを押すとAddCellコンポーネントで奇妙なﾄﾗﾝｼﾞｼｮﾝが発生する

理由は一番下の`AddCell`コンポーネントがkeyを受け取っていないからである

```
    UI:

    ─────────[+Code]───[+Text]───────────   key: 'aaa'

    ┌────────────────────────────────────┐
    │               CELL    id: aaa      │
    └────────────────────────────────────┘

    ─────────[+Code]───[+Text]───────────   key: no key!

```

このとき下の方の`AddCell`を押すと...

```
    UI:

    ─────────[+Code]───[+Text]───────────   key: 'aaa'

    ┌────────────────────────────────────┐
    │               CELL    id: aaa      │
    └────────────────────────────────────┘

    ─────────[+Code]───[+Text]───────────   key: 'bbb'

    ┌────────────────────────────────────┐
    │               CELL    id: bbb      │
    └────────────────────────────────────┘

    ─────────[+Code]───[+Text]───────────   key: no key!

```

最終的にkey: `bbb`のHTML、

`Fragment`でラッピングされている`AddCell`と`CellListItem`のペアが

直接DOMに挿入されることになる。

さっきまで一番下のにあったAddCellコンポーネントのボタンをマウスが押していたが

セルの追加によってそのコンポーネントは下に移動した。


#### 解決策３つ

