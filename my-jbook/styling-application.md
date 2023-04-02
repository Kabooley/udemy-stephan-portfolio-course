# Styling Application

## 実装すること

- エディタパッケージを導入してVSCodeっぽいエディタを実装する
- エディタにはdiffエディタ機能を設ける
- 講義と異なるレイアウトになるかも(リサイズは可能にする)

## どういうレイアウトにするか

layout-index
  header
  content
    [
      editor or diffeditor
      preview
    ]


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

TODO: ノート貼り付け


#### 公式のDemoとソースコードあるからこれを参考に作ればいいのでは？

Source:



Demo:

https://monaco-react.surenatoyan.com/

デモだと開発言語やカラーテーマを選択できる

デモのソースコードを参考にエディタと設定画面を作成しよう。

```TypeScript
// App.js
import React from 'react';
import ErrorBoundary from 'react-error-boundary';
import ErrorBoundaryFallback from 'components/ErrorBoundaryFallback';
import Layout from 'layout';

const App = _ => (
  <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
    <Layout />
  </ErrorBoundary>
);

export default App;

// Layout/index.js
import React from 'react';

import Header from './Header';
import Content from './Content';

import { ThemeProvider } from 'theme';

const Layout = _ => <ThemeProvider>
  <section className="full-size">
    <Header />
    <Content />
  </section>
</ThemeProvider>;

export default Layout;

// 
```

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

#### Prettier

#### ESLint

#### TypeScriptコード補完

#### エラー・ハイライティング

## 実装 レイアウト

#### エディタとプレビュー画面を横に並べる



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