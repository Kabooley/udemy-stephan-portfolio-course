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