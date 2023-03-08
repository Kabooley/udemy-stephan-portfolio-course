# 開発メモ

講義で作成するアプリケーションを、ノートを基に一から自分で作成する。

## 目次

- [実装](#実装)

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


## 実装

## Bundler

esbuild-wasm:

#### `startSErvice` vs. `initialize`

https://stackoverflow.com/a/66586893

つまり同じ内容を実行する関数名が変更になったよ。

公式には詳しい内容が載っていないので自分でtype.d.tsみてってことに。

#### `initialize`

```TypeScript

/**
 * This configures the browser-based version of esbuild. It is necessary to
 * call this first and wait for the returned promise to be resolved before
 * making other API calls when using esbuild in the browser.
 *
 * - Works in node: yes
 * - Works in browser: yes ("options" is required)
 *
 * Documentation: https://esbuild.github.io/api/#browser
 */
export declare function initialize(options: InitializeOptions): Promise<void>

export interface InitializeOptions {
  /**
   * The URL of the "esbuild.wasm" file. This must be provided when running
   * esbuild in the browser.
   */
  wasmURL?: string | URL

  /**
   * The result of calling "new WebAssembly.Module(buffer)" where "buffer"
   * is a typed array or ArrayBuffer containing the binary code of the
   * "esbuild.wasm" file.
   *
   * You can use this as an alternative to "wasmURL" for environments where it's
   * not possible to download the WebAssembly module.
   */
  wasmModule?: WebAssembly.Module

  /**
   * By default esbuild runs the WebAssembly-based browser API in a web worker
   * to avoid blocking the UI thread. This can be disabled by setting "worker"
   * to false.
   */
  worker?: boolean
}

export let version: string
```

- `initialize()`はブラウザでesbuildAPIを使うときに一番初めに呼出その結果が返ってくるまで他のAPIを使うことが許されない。
- ブラウザで利用したいときは引数の`options`が必須である。
- `worker`はデフォルトでtrueである

#### `build`

https://esbuild.github.io/api/#bundle

デフォルトの動作でesbuildは`esbuild.build`呼出をしてもインプットファイルをバンドリングしてくれない。

バンドリングは明示的に指示しなくてはならない: `bundle: true`のように。

インプットファイルに依存関係があれば、esbuildはそれらをたどって依存関係のファイルもバンドリングしていくのでインプットファイルに必要な依存関係がimportされていたりするならばすべてのファイルをインプットファイルに書き出す必要はない。

バンドリングは静的なimportにのみ有効であるので、動的importはバンドリングされない。

#### `rebuild`

https://esbuild.github.io/api/#rebuild

build APIを継続的に同じオプションで呼び出したいときに使う。

`rebuild`は`build`を何度も呼出すよりも効率的である。

なぜなら前回のビルド内容をキャッシュして毎度比較してくれるからである。

**Filesystemが存在する場合にのみ有効な機能であり、pluginsを使うような場合にはキャッシュ機能は使えない**

ハイ使えません。

同様の理由で、`watch`、`cancel`等の機能も使えない。

#### `entryPoints`

https://esbuild.github.io/api/#entry-points

要はエントリーポイントは複数にするべきか、単一にするべきかの議論。

シンプルにするならエントリーポイントのファイルは一つで十分である。

分ける必要があるとすれば、

メインスレッドとワーカースレッドというように論理的に独立したコンテキストで動くようにしているアプリケーションを扱うときである。

今回は不要ですね。

#### Loader

このオプションはインプット・ファイルをどのように解釈するのかを指定するものである。

通常は.jsはJavaScript、.cssはCSSファイルと解釈するという意味である。

今回は不要かも。

#### outDir

ブラウザ上にはFilesystemないし、コードはファイルではなくてstringで受け取るので不要

#### `write`

ビルド結果をふぃあるシステムに書き込むかメモリバッファに書き込むかを選択できるプロパティ。

例：

```JavaScript
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.js'],
  sourcemap: 'external',
  write: false,
  outdir: 'out',
})

for (let out of result.outputFiles) {
  console.log(out.path, out.contents, out.text)
}
```

つまり、

`write: false`を指定しないと通常ファイルシステムに書き込まれるということで

`write: false`としておけば上記のように値としてビルド結果のコードを取得できるということかしら？



#### Editor

formで囲うのが当たり前なのかどうかってどうしたら判断できるでしょうか

ひとまずボタンで変換処理をするようにするので一旦端に於いておく

