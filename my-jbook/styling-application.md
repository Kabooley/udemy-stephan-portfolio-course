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

- onChange等のイベントはmonacoeditor独特のものである
- editorインスタンスとmonacoインスタンスの2つがある



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