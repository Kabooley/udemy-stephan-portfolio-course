# Styling Application

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

- `Editor`コンポーネントをimportしてつかうことでエディタが表示される

- editorインスタンスとmonacoインスタンスの2つがある

onMountハンドラを見ると、2つのインスタンスを引数として取得する模様。

それぞれどう使い分けるのだ？

```TypeScript
export type OnMount = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monaco: Monaco,
) => void;
```
```TypeScript
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// monaco
export type Monaco = typeof monaco;
```

Monacoは本家のmonaco-editorのAPIのインスタンスみたい。

Editorの方も結局本家monaco-editorのapiを指している

```TypeScript

// ICodeEditor <-- IEditorと継承している模様
  export interface IStandaloneCodeEditor extends ICodeEditor {
      updateOptions(newOptions: IEditorOptions & IGlobalEditorOptions): void;
      addCommand(keybinding: number, handler: ICommandHandler, context?: string): string | null;
      createContextKey<T extends ContextKeyValue = ContextKeyValue>(key: string, defaultValue: T): IContextKey<T>;
      addAction(descriptor: IActionDescriptor): IDisposable;
  }
```

そのままeditorのインスタンスなのかしら

結局わからん。

ただ公式ではuseRefで指すのはeditorの方だと言っているのでそうすればいいのかと。

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