# 開発メモ

講義で作成するアプリケーションを、ノートを基に一から自分で作成する。

## ブラウザでトランスパイリング、バンドリング

トランスパイリング：モダンな記法をES5以前の記法に変換する処理のこと。Babelがやっていること。

バンドリング：依存関係の解決。一つのファイルに出力する。Webpackとかがやっていること。

今回のアプリケーションはブラウザ上でバンドリングをするか、サーバ上でバンドリングする。

いずれにしても、

- ユーザが要求する予測不能のパッケージをインポートできなくてはならない
- ブラウザ上だとファイルシステムがない

普通バンドリングは開発中に使うもので、アプリケーションの機能として使う場合常にブラウザで使うことを念頭に置かなくてはならない。

## [自習] Webpack Concepts

https://webpack.js.org/concepts/

> WebpackはモダンJavaScript向けの静的モジュールバンドラである。

5つの重要な概念：

- Entry
- Output
- Loaders
- Plugins
- Mode
- Browser Compatibility

#### Entry

エントリーポイントはWebpackのビルドの開始点を示す。

なのでまずWebpackはこのEntryポイントのファイルの依存関係から洗い出すことを始めることになる。

デフォルトで`./src/index.js`がエントリポイントとなるが、

`webpack.config.js`で任意に指定できる。

#### Output

`Output`はWebpackにどこへバンドル結果を出力するのかを指定するプロパティである。

デフォルト：`./dist/main.js`

同様に`webpack.config.js`で指定できる。

```JavaScript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './path/to/my/entry/file.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'my-first-webpack.bundle.js',
  },
};
```

#### Loaders

`Loaders`はWebpackが取り扱うことができないJSまたはJSON以外のファイルを取り込んで使えるモジュールとして取り込むことを可能にするプロパティである。

`loaders`プロパティは2つのプロパティを持つ。

- `test`: どのファイルを変換するの間指定する
- `use`: どのローダーを変換に用いるのか指定する

```JavaScript
const path = require('path');

module.exports = {
  output: {
    filename: 'my-first-webpack.bundle.js',
  },
  module: {
    rules: [{ test: /\.txt$/, use: 'raw-loader' }],
  },
};
```

意味：「"/\.txt$/"という拡張子のルールに合致する依存関係を`import`か`require()`で発見したら`raw-loader`というローダを使って変換をしてくれ」

#### Plugins

> ローダーは特定のタイプのモジュールを変換するために使用されますが、プラグインを利用して、バンドルの最適化、アセット管理、環境変数の挿入など、より幅広いタスクを実行できます。

`webpack.config.js`ファイルに使いたいプラグインをインポートして`plugins`プロパティに追加する。

#### Mode

開発モード化プロダクトモードか指定する

## [自習] ESbuild

#### WASM Version

https://esbuild.github.io/getting-started/#wasm

esbuild-wasmはとても遅い。

> The WebAssembly package is primarily intended to only be used in the browser.

WebAssemblyは主にブラウザ上で使われることを想定しています。

#### In the Browser

https://esbuild.github.io/api/#browser



## [参考] JavaScript Module Systems Showdown: CommonJS vs AMD vs ES2015

時間があれば。