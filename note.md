# Stephan Grinder: Portfolio Course

## Three Big Challanges

1. ユーザから入力された文字列のコードを安全に実行させること

2. ユーザが入力したコードはモダンな文法の可能性が十分にあり、ブラウザが対応していない可能性があること

3. ユーザが入力したコードはimport分などを含む場合があり、コードを実行する前に依存関係を解決しなくてはならない

## Module System

#### What are the differences between Babel and Webpack?

https://stackoverflow.com/a/47006938

Babel: モダンなJvavaScript文法を、どのブラウザでも実行できるES5以前のコードに変換してくれる「トランスパイラ」である。

Bundler: 依存関係の解析とモジュールバンドリングを行う「ビルドシステムである」。webpackはBundlerの中でもっとも普及している物の一つである。一般的な概念は、Webpack が複雑な依存関係を持つモジュールをバンドルにパッケージ化することです。
要は複雑な依存関係を解決したコードを一つのファイルにまとめる技術である。

## section8の内容

`./transpiling-and-bundling-in-browser.md`にまとめた。
