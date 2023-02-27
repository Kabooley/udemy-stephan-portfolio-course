# Note: Section11 Displaying a Code Editor In a ReactAPP

エディタ画面を一般的な物にしていく。

NOTE: 関係ないけど記事の方更新してアプリケーションの宣伝をしよう



## Monaco Editor

一般的なエディターに備わっているものを提供してくれるパッケージ。

React v18以降を使っている人は

MonacoEditorをインストールするときは次のように

`--legacy-peer-deps`フラグを付けること

```bash
$ cd jbook
$ npm install --save-exact @monaco-editor/react@3.7.5 --legacy-peer-deps
```

> **今後、このコースで作成されるすべてのnpm installコマンドに--legacy-peer-depsフラグを渡す必要があります。**

#### Eidtorの表示

MonacoEditorのデフォルトのエディターコンポーネントを用いる。

これはMonacoEditorでいうところの`controllededitor`ではない。

touch `src/components/code-editor.tsx`

```TypeScript
// code-editor.tsx
import MonacoEditor from '@monaco-editor/react';

const CodeEditor = () => {
    // デフォルトだと高さが0で設定されているので
    return <MonacoEditor height="500px" />;
};

export default CodeEditor;
```

#### Configuring

*設定の適用*

monaco-editor/reactは、

実際のMonacoEditorのラッパーコンポーネントである。

「実際のMonacoEditor」はReactで書かれているわけではない。

```TypeScript
// code-editor.tsx
import MonacoEditor from '@monaco-editor/react';

const CodeEditor = () => {

    return <MonacoEditor 
        // 設定を設ける
        language="javascript"
        theme="dark"
        height="500px" 
    />;
};

export default CodeEditor;
```


#### ユーザが長文を入力したらなどエディター設定

デフォルトは横にスクロール。

折り返すなどの設定を適用したいときは？

`monacoeditor.editor.IEditorConstructionOptions`を操作する。

そのために以下をインストールする必要がある。(型定義を見るために)

```bash
$ npm install --save-exact monaco-editor
```

```TypeScript
// code-editor.tsx

const CodeEditor = () => {

    return <MonacoEditor 
        // 設定を設ける
        language="javascript"
        theme="dark"
        height="500px" 
        options={{
            wordWrap: 'on',
            // 他にも
            miniMap: { enabled: false },
            showUnused: false,
            folding: false,
            lineNumberMinChars: 3,
            fontSize: 16,
            scrollBeyondLastLine: false,
            automaticLayout: true,
        }}
    />;
};
```

## Monacoeditorに出力させる

MonacoEditorへ入力された値を親コンポーネントへ送信する。


```TypeScript
// code-editor.tsx

interface CodeEditorProps {
    initialValue: string;
};

// index.tsxからinitialValueのpropsを受け取る
const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue
}) => {

    return <MonacoEditor 
        value={initialValue} //ここに値を与えればよい
        language="javascript"
        theme="dark"
        height="500px" 
        options={{
            wordWrap: 'on',
            miniMap: { enabled: false },
            showUnused: false,
            folding: false,
            lineNumberMinChars: 3,
            fontSize: 16,
            scrollBeyondLastLine: false,
            automaticLayout: true,
        }}
    />;
};
```

#### onChange

ユーザ入力フォームでのchangeイベントと連動させる。

```TypeScript
// index.tsx

// ...
return (
    <div>
        <CodeEditor
            initialValue="const a = 1;"
            onChange={(value) => setInput(value)}
        />
        // ...
```
```TypeScript
// code-editor.tsx

interface CodeEditorProps {
    initialValue: string;
    onChange: () => string;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue, onChange
}) => {

    return <MonacoEditor 
        onChange={onChange}
        value={initialValue}
        language="javascript"
        theme="dark"
        height="500px" 
        options={{
            wordWrap: 'on',
            miniMap: { enabled: false },
            showUnused: false,
            folding: false,
            lineNumberMinChars: 3,
            fontSize: 16,
            scrollBeyondLastLine: false,
            automaticLayout: true,
        }}
    />;
};
```

onChangeで反応するようにするとエラーが起こるので、

`editorDidMount`時に値を更新することにする

```TypeScript

const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue, onChange
}) => {
    const onEditorDidMount = (
        getvalue: () => string, // editorDidMount関数が必ず取得することになる関数で入力されてある値を返す。
        monacoEditor: any
    ) => {
        monacoEditor.onDidChangeModelContent(() => {
            onChange(getValue());
        });
    };

    return <MonacoEditor 
        editorDidMount={onEditorDidMount}
        value={initialValue}
        language="javascript"
        theme="dark"
        height="500px" 
        options={{
            wordWrap: 'on',
            miniMap: { enabled: false },
            showUnused: false,
            folding: false,
            lineNumberMinChars: 3,
            fontSize: 16,
            scrollBeyondLastLine: false,
            automaticLayout: true,
        }}
    />;
};
```

#### Prettierをエディタに導入する

```bash
$ npm install prettier @types/prettier
```
```TypeScript
import prettier from 'prettier';
import parser from 'prettier/perser-babel';
```

エディタに入力されてある値にアクセスできなくてはならない。

useRefを使う。

```TypeScript
const editorRef = useRef<any>;

const onEditorDidMount = () => {
    editorref.current = monacoEditor;
};

const onFormatClick = () => {
    // エディタに入力されてある値を取得する
    const unformatted = editorRef.current.getModel().getValue();
    // fomat that value
    const formetted = prettier.format(unformatted, {
        parser: 'babel',
        plugins: [parser],
        useTabs: false,
        semi: true,
        singleQuote: true
    });

    // send it back
    editorRef.current.setValue(formatted);
}
```

## Adding a CSS Library

```bash
$ cd jbook
$ npm install bulmaswatch
```

見た目の話。割愛。


#### CodeCell

```TypeScript
// code-cell.tsx
import { useState } from 'react';
import CodeEditor from './code-editor';
import Preview from './preview';
import bundle from '../bundler';

const CodelCell = () => {
    const [code, setCode] = useState('');
    const [input, setInput] = useState('');

    const onClick = () => {
        const output = await bundle(input);
        setCode(output);
    };

    return (
        //...
    );
};

export default CodeCell;
```
```TypeScript
// index.tsx
import 'bulmaswatch/superhero/bulmaswatch.min.css';
import ReactDOM from 'react-dom';
import CodeCell from './components/code-cell';

const App = () => {
    return (
        <div>
            // 将来的にこのCodeCellコンポーネントの配列を渡すようになる
            <CodeCell />
        </div>;
    );
};

// ...
```

## リサイジング

エディタとプレビューをリサイジング可能にする

#### `react-resizable`

```bash
$ cd jbook
$ npm install --save-exact react-resizable@3.0.4 @types/react-resizable@3.0.2 --legacy-peer-deps
$ yarn add --exact react-resizable@3.0.4 @types/react-resizable@3.0.2 --legacy-peer-deps
```

`import { Resizable, ResizableBox } from 'react-resizable';`より、

- Resizable: 
- ResizableBox: 

```TypeScript
// components/resizable.tsx
import { ResizableBox } from 'react-resizable';

interface ResizableProps {
    direction: 'horizontal' | 'vertical';
  children?: React.ReactNode;
};

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
    return (<div>{children}</div>);
};

export default Resizable;
```

#### リサイズハンドル

エディタとプレビュー画面のリサイジングをハンドルを使って操作できるようにしたい。

