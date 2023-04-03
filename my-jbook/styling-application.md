# Styling Application

## 実装すること

- エディタパッケージを導入してVSCodeっぽいエディタを実装する
- エディタにはdiffエディタ機能を設ける
- 講義と異なるレイアウトになるかも(リサイズは可能にする)

## メモ

テストコード:

```JavaScript
import { createRoot } from 'react-dom/client';
import React from 'react';
import 'bulma/css/bulma.css';

const App = () => {
    return (
        <div className="container">
          <span>REACT</span>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

## Monaco editor

https://github.com/microsoft/monaco-editor

microsoft謹製らしい。なので信頼できるね。

VSCodeそのものにできればいいかも。

講義で使っていたのは`@monaco-editor/react`で、こっちは`monaco-editor`で開発元が異なる。

...やっぱりだめだ。セットアップが大変すぎるこれ。

`@monaco-editor/react`は内部でmonaco-editorを使う、セットアップが不要なreactで使えるmonaco-editorだ。

DirectXにたいするDXLibraryみたいなやつや

はぁ時間無駄にしたぁ

## `@monaco-editor/react`

https://github.com/suren-atoyan/monaco-react

READMEまとめ

#### Synopsis

> Monacoエディタラッパーは、webpack（または他のモジュールバンドルラー）の設定ファイルやプラグインを使用せずに、Reactアプリケーションに簡単かつワンラインで統合することができます。create-react-app、create-snowpack-app、vite、Next.js、その他のアプリジェネレータで生成されたアプリで使用することができ、アプリを削除したり配線し直したりする必要はありません。CDNからバンドルなしで使用することもできます。

TypeScriptの型定義が必要な場合、本家`monaco-editor`もインストールすること。

#### Usage

エディタに入力された値を取得する方法

1. refに、`editor.OnMount`ハンドラの第一引数`editor`を渡すことで`ref.current.getValue()`で取得する(DiffEditorも同様に取得できる)
2. `editor.OnChange`ハンドラの引数で取得する


```JavaScript
import React, { useRef } from "react";
import ReactDOM from "react-dom";

import Editor from "@monaco-editor/react";

function App() {
  const editorRef = useRef(null);

  // way 1:
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor; 
  }
    
  function showValue() {
    alert(editorRef.current.getValue());
  }

  // way 2:
  function handleEditorChange(value, event) {
    console.log("here is the current model value:", value);
  }


  return (
   <>
     <button onClick={showValue}>Show value</button>
     <Editor
       height="90vh"
       defaultLanguage="javascript"
       defaultValue="// some comment"
       onMount={handleEditorDidMount}
       onChange={handleEditorChange}
     />
   </>
  );
}
```

エディタインスタンスを取得する方法

インスタンスには`editor`, `monaco`の2種類があり、取得する方法は３種類ある。

1. via `onMount/beforeMount`
2. via `loader` utility
3. via `useMonaco`

公式のサンプル見たほうが早い

https://github.com/suren-atoyan/monaco-react#monaco-instance

#### `useMonaco`について

https://github.com/suren-atoyan/monaco-react#usemonaco

> useMonacoは、monacoのインスタンスを返すReactフックです。しかし、考慮すべき重要な注意点があります。初期化処理は、loaderユーティリティ（@monaco-editor/loaderの参照）によって処理されます：その処理は、非同期に、一度だけ実行されます。つまり、初期化の最初のイニシエータが useMonaco フックの場合、その非同期インストールにより、最初の戻り値は null となります。useMonacoの返り値を確認してみましょう。

```JavaScript
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import Editor, { useMonaco } from "@monaco-editor/react";

function App() {
  // この時点ではnullである
  // 理由はmonacoは非同期処理で取得できるから
  const monaco = useMonaco();
  
  useEffect(() => {
    // do conditional chaining
    monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    // or make sure that it exists by other ways
    if (monaco) {
        // 取得できたことを確認できる
      console.log("here is the monaco instance:", monaco);
    }
    // 非同期にロード出来たら
  }, [monaco]);

  return (
    <Editor
      height="90vh"
      defaultValue="// some comment"
      defaultLanguage="javascript"
    />
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```


#### `loader-config`について

https://github.com/suren-atoyan/monaco-react#loader-config

> このライブラリは、loaderというユーティリティをエクスポート（名前付け）しています。基本的には@monaco-editor/loaderを参照することになります。デフォルトでは、monacoのファイルはCDNからダウンロードされています。この動作を変更する機能など、monacoのAMDローダーに関するものが用意されています。デフォルトの設定ファイルを用意しましたので、以下の方法で変更してください：

ということで以下のURLからmonacoファイルがダウンロードされている模様。

```JavaScript
const config = {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.0/min/vs',
  },
}

export default config;

// ---

import { loader } from "@monaco-editor/react";

// you can change the source of the monaco files
loader.config({ paths: { vs: "..." } });

// you can configure the locales
loader.config({ "vs/nls": { availableLanguages: { "*": "de" } } });

// or
loader.config({
  paths: {
    vs: "...",
  },
  "vs/nls" : {
    availableLanguages: {
      "*": "de",
    },
  },
});
```
ちょっとよくわからん。

#### Multi-Model Editor

https://github.com/suren-atoyan/monaco-react#multi-model-editor

デモ：

https://codesandbox.io/s/multi-model-editor-kugi6?file=/src/App.js

マルチモデルエディタとは、上記のデモの通りcodepenのようなHTML,CSS,JSそれぞれについてエディタを生成するような場合のことである。

ここでいうモデルとは、インスタンスに対するクラスのようなもので

> ('@monaco-editor/react'からimportできる)`Editor`コンポーネントをレンダリングすると、デフォルトのモデルが作成されます。言語や値のプロップを変更すると、コンポーネントのマウント時に自動作成された同じモデルに影響を与えるということは重要です。ほとんどの場合、これは問題ないのですが、IDEのようにタブやファイルをサポートするマルチモデルエディタを実装したい場合、開発者は問題に直面します。

> また、以前は複数のモデルを扱うには、コンポーネントの外で手動で行う必要がありました。今回、マルチモデルAPIがサポートされました🎉 では、その動作を確認してみましょう。モデルを作成するためのパラメータは、値、言語、パスの3つです（ (monaco.editor.createModel(value, language, monaco.Uri.parse(path)))。最後の1つ（パス）は、モデルの識別子と考えることができます。Editorコンポーネントには、pathプロップが用意されています。pathプロパティを指定すると、Editorコンポーネントは、そのパスによるモデルがあるかどうかをチェックします。もしあれば、既存のモデルが表示され、そうでなければ、新しいモデルが作成されます（そして保存されます）。このテクニックを使えば、ファイルをパスで対応させ、完全なマルチモデルエディタを作成することができます。ファイルを開いて変更を加え、別のファイルを選択し、最初のファイルに戻ると、前のモデルが表示状態、テキスト選択、アンドゥスタック、スクロール位置などすべて表示されます（簡単なデモです）。

つまり、

プロパティの変更は、Editorコンポーネントの元となるモデルに影響を及ぼし、複数Editorコンポーネントを出力したりすると変更がすべてに適用されることになるということかしら。

でも最近マルチモデルを実現するためのAPIができたから、`Editor`の`path`プロパティへそれぞれのモデルとなるファイルのパスを渡すことでことなるプロパティのエディタを出力することができる

ということらしい。

propertyに関して

- `defaultValue`、`defaultLanguage`、`defaultPath`は、モデルの新規作成時のみ考慮される
- `value`、`language`、`path`は常に変更が追跡される
- `saveViewState`は、モデルチェンジの際にモデルのビュー状態を保存するかどうかの指標



#### 参考：公式デモ

https://monaco-react.surenatoyan.com/

デモだと開発言語やカラーテーマを選択できる

デモのソースコードを参考にエディタと設定画面を作成しよう。


## 実装 コードエディタ

#### エディに入力された値を取得する仕組み

NOTE: あとでredux使うので一時的な話

```bash
src/sections/Content/

index.tsx
  Editor/CodeEditor.tsx
  Editor/DiffEditor.tsx
  Preview/index.tsx
```
ひとまずonChangeHandlerをindex.tsxで定義してprops経由でCodeEditor.tsxへ渡す方法をとる

#### DiffEditorをどうやって表示させるのか

どんな機能を提供したいのかに依る

TODO: あとで実装。ひとまずCodeEditorに基本機能を盛り込んで

#### エラー・ハイライティング

ユーザ入力されたコードがエラーを起こしたときにiframeにエラーが起こったことを表示させるようにする。

```JavaScript
const previewTemplate = `
<html>
  <head></head>
  <body>
    <div id="root"></div>
      <script>
        window.addEventListener('message', (e) => {
          try {
            console.log(e);
            if(e.data === undefined || e.data.code === undefined) throw new Error("Error: property data or data.code is undefined");
            // NOTE: using eval() !
            eval(e.data.code);
          }
          catch(err) {
            // NOTE: stack is not standard property of Error object.
            const { message, name, stack } = err;
            const root = document.querySelector('#root');
            root.innerHTML = '<div style="color: red;"><h3>' + name + '</h3>' + message + stack +'</div>';
            console.error(err);
          }
        }, false);
      </script>
  </body>
</html>
`;
```

TODO: 正確に1行ずつ表示させたいけど後回し。

#### Prettier

#### ESLint

#### TypeScriptコード補完


## 実装 レイアウト

#### エディタとプレビュー画面を横に並べる

## 実装 エディタ機能

#### テンプレートHTMLをinnerHTML = ''などさせないようにする

今ユーザが

```JavaScript
document.querySelector('#root').innerHTML = "";
```

を入力したとしたら、

以降previewのHTML内部に`div#root`が永遠に消失してしまう。

このような場合の対策。

解決策：bundlingする前に常にテンプレートHTMLをリセットする

```JavaScript
  const onSubmitHandler = async (): Promise<void> => {
      if(previewRef.current && previewRef.current.contentWindow) {

          // NOTE: To AVOID srcdoc to be empty by user.
          previewRef.current.srcdoc = previewTemplate;

          const result = await bundler(code);

          previewRef.current.contentWindow.postMessage({
              code: result.code
          }, '*');
      }
  };
```

こうすれば`document.querySelector('#root').innerHTML = ""`というコードを入力されても次のバンドル時には元に戻っている。


#### フォーマット

#### クリア

いらないかも。

## [React Tips] `onChange` event type

`onChange`ハンドラのevent引数はどう型を付ければよいのか

https://stackoverflow.com/questions/40676343/typescript-input-onchange-event-target-value

```TypeScript
const onChange = (e: React.FormEvent<HTMLInputElement>) => {
  const newValue = e.currentTarget.value;
}

// You can read why it so here (Revert "Make SyntheticEvent.target generic, not SyntheticEvent.currentTarget.").

// UPD: As mentioned by @roger-gusmao ChangeEvent more suitable for typing form events.

const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
}
```


## [TypeScript] Tips

#### `useRef<HTMLXXX>()` possibly null

```TypeScript
import React, { useState, useRef } from 'react';

const ContentSection = () => {
  // ...
    const previewRef = useRef<HTMLIFrameElement>(null);

    const onSubmitHandler = async (): Promise<void> => {
        if(!previewRef.current) return;

        const result = await bundler(code);

        // NOTE: ERROR: previewRef.current.contentWindow possibly null
        previewRef.current.contentWindow.postMessage({
            code: result.code
        }, '*');
    };

    return (
        <div>
            // ...
            <Preview ref={previewRef} />
        </div>
    );
}

```

## [JavaScript] Tips

#### Get error stack trace

https://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception

`Error`オブジェクトの`stack`プロパティを呼び出すだけ。

しかし、

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack

`Error.prototype.stack` is not standarad.

採用されていないブラウザがあったり表現のされ方が異なるかもしれない。