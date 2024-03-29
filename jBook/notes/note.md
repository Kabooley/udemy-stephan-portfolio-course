# 開発ノート

## 実装する機能

エディタとしての機能：

- JSX Highlighting
- ESlint
- Prettier Formatting
- 他参考サイトで実装している機能など

マルチスレッドとして：

- bundling機能はworkerに切り分けるべきなのか

アプリケーションの基本機能として：

- codesandboxみたいにHTML, CSS, JavaScriptからなるプロジェクトを実行できるアプリケーションにする


## 走り書き

4/18:

ひとまずself.tsが認識してくれない問題が解決できるまでは
ESLIntやjsxhighlightは後回しで。

とにかくwebworkerが動かせるのかだけ確認する

## 参考

https://blog.expo.dev/building-a-code-editor-with-monaco-f84b3a06deaf

https://github.com/satya164/monaco-editor-boilerplate

https://github.com/codesandbox/codesandbox-client/blob/196301c919dd032dccc08cbeb48cf8722eadd36b/packages/app/src/app/components/CodeEditor/Monaco/workers/syntax-highlighter.js


## 実装：WebWorker + React

正しい使い方とは？

- useMemo() + useEffect()
- classを使う

## 実装: JSX-Highlighting

#### MonacoEditorからハイライトする値を取得・返却するタイミング

はどこがいいのでしょうか。

いつもの参考サイトを参考にする。

[@monaco-editor/react挙動確認](#@monaco-editor/react挙動確認)



#### importScriptで取りこんだTypeScriptモジュールの実態はどこ？

通常`self`に追加されているみたいなんだが、TypeScriptだとそれ誰ってエラーになる。

```TypeScript
// jsx-highlight.worker.ts

// たぶんこいつのモジュールの実態が`self.ts`なんだろうけど...
self.importScripts(
    'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.0.4/typescript.min.js',
);

// ...

  // Respond to message from parent thread
  self.onmessage = (event: MessageEvent</* TODO: DEFINE */>) => {
    const { code, title, version }: iSyntaxHighlightMessageData = event.data;
    try {
      const classifications = [];
      //  NOTE: `ts`って何？ってなる
      const sourceFile = self.ts.createSourceFile(
        title,
        code,
        self.ts.ScriptTarget.ES6,
        true
      );
      const lines = code.split('\n').map(line => line.length);
  
      addChildNodes(sourceFile, lines, classifications);
  
      self.postMessage({ classifications, version });
    } catch (e) {
      /* Ignore error */
    }
  });
```
`node_modules/typescript/lib/typescript.d.ts`によれば

一番初めの定義が

```TypeScript
declare namespace ts {
    // ...
}
```

だし、

使っている関数もここで確かに定義されていた。

ひとまずself.tsがエラー表示されてしまうのは置いておいて、



#### typescript.min.js

`self.ts`の正体は多分cloudflareでインポートしたtypescriptのscriptファイルなんだけど

型情報を設けなくてはならないのでtsってなんやねんってなっている

https://cdnjs.com/libraries/typescript

ここでworkerでimportScriptしていたtypescriptのURLと同じものを見つけた

`https://cdnjs.cloudflare.com/ajax/libs/typescript/5.0.4/typescript.min.js`

https://github.com/CompuIves/codesandbox-client/blob/dcdb4169bcbe3e5aeaebae19ff1d45940c1af834/packages/app/src/app/components/CodeEditor/Monaco/workers/fetch-dependency-typings.js

## 実装：ESLint

- ESLint Bundleってどうやって生成するのか
- monaco-editorのデフォのlintを無効にして用意したESlintを有効にさせる方法

#### MonacoEditorからlintする値を取得・返却するタイミング

はどこがいいのでしょうか。

いつもの参考サイトを参考にする。

参考リポジトリに依ればcomponentdidmountの時であった。



## 実装：Formatting

## monaco-editor, @monaco-editor/reactのわからないところノート

- ESLintする値を取得・返却するタイミングはいつがいいのか
- jsx-highlightする値を取得・返却するタイミングはいつがいいのか
- onvalidateは何のために使うのか

など。



## React + TypeScript Tips

#### `widnow`なんてないよといわれたら

https://stackoverflow.com/questions/41336301/typescript-cannot-find-name-window-or-document

tsconfigで`"lib: ["dom"]`を設定する


## @monaco-editor/react挙動確認

monaco-editor本家も確認のこと

.d.tsみても下記がMonacoEditorコンポーネントのメソッド

- `onChange`: 現在のmodelの内容が変更されたときにイベントは発行される
- `onMount`: editorがマウントされたらイベントが発行される
- `beforeMount`: editorがマウントされる前にイベントが発行される
- `onValidate`: 現在のmodelの内容が変更されたとき、または現在のmarkerが準備完了したらイベントが発行される

monaco-editor:

TypeScript + Reactのサンプルあるじゃん...

```JavaScript
import React, { useEffect, useRef } from 'react';
import monaco from 'monaco-editor';

export const Editor: React.FC = () => {
  const divEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if(divEl.current) {
      // createModel() create()でmonaco-editorが表示される
      editor.monaco.create(
        // Editorを挿入するDOMを指定する
        divEl.current, 
        // Editorの初期プロパティなどを指定する
        {
          value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
          language: 'typescript'
      });
    }
      return () => {
        editor.dispose();
      }
  }, []);

  return (
    <div className="Editor" ref={divEl}></div>
  );
}
```

JSX-Highlighting:

本家のplaygroundで`Syntax Highlighting for Html Elements`を選択

`monaco.editor.colorizeElement()`

```HTML

```


## 参考

monaco-editorを使うにあたってのあれこれを投稿してくれた人のリポジトリ：

https://github.com/satya164/monaco-editor-boilerplate


## 走り書き

#### monaco-editor/reactをいじって何ができるのか確認

- monaco`OnChange`: Editorコンポーネントの中身を編集すると反応する

一文字ごとの変更に反応

- markerとは何？

monaco-editor: 

https://microsoft.github.io/monaco-editor/docs.html#functions/editor.setModelMarkers.html

IMarkerが元の型らしい

IMakerData:

> A structure defining a problem/warning/etc.

boilerplate repoではcomponentdidmountで一度だけ呼び出していた。

```JavaScript
// getModelで現在のモデルを取得して、setModelMarkers()でセットしたいマーカーをセットする
   _updateMarkers = ({ markers, version }: any) => {
    requestAnimationFrame(() => {
      const model = this._editor.getModel();

      if (model && model.getVersionId() === version) {
        monaco.editor.setModelMarkers(model, 'eslint', markers);
      }
    });
   }
```

早速実装してみよう

useEffect()でworkerから返事があったらmarkerをsetModelMarker()する

そのためupdaterはmonacoのインスタンスにアクセスできないといけない

なんだか@monaco-editor/reactよりもmonaco-editor本家をboilerplate repoの通りreact class化した方が使いやすいような気がしてきた。