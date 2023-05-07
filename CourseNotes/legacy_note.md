# 開発メモ

講義で作成するアプリケーションを、ノートを基に一から自分で作成する。

## 目次

## ブラウザでトランスパイリング、バンドリング

トランスパイリング：モダンな記法を ES5 以前の記法に変換する処理のこと。Babel がやっていること。

バンドリング：依存関係の解決。一つのファイルに出力する。Webpack とかがやっていること。

今回のアプリケーションはブラウザ上でバンドリングをするか、サーバ上でバンドリングする。

いずれにしても、

- ユーザが要求する予測不能のパッケージをインポートできなくてはならない
- ブラウザ上だとファイルシステムがない

普通バンドリングは開発中に使うもので、アプリケーションの機能として使う場合常にブラウザで使うことを念頭に置かなくてはならない。

## Webpack Concepts

https://webpack.js.org/concepts/

> Webpack はモダン JavaScript 向けの静的モジュールバンドラである。

5 つの重要な概念：

- Entry
- Output
- Loaders
- Plugins
- Mode
- Browser Compatibility

#### Entry

エントリーポイントは Webpack のビルドの開始点を示す。

なのでまず Webpack はこの Entry ポイントのファイルの依存関係から洗い出すことを始めることになる。

デフォルトで`./src/index.js`がエントリポイントとなるが、

`webpack.config.js`で任意に指定できる。

#### Output

`Output`は Webpack にどこへバンドル結果を出力するのかを指定するプロパティである。

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

`Loaders`は Webpack が取り扱うことができない JS または JSON 以外のファイルを取り込んで使えるモジュールとして取り込むことを可能にするプロパティである。

`loaders`プロパティは 2 つのプロパティを持つ。

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

## ESbuild

`esbuild-wasm`は ESBuild の WebAssembley である。

#### WASM Version

https://esbuild.github.io/getting-started/#wasm

esbuild-wasm はとても遅い。

> The WebAssembly package is primarily intended to only be used in the browser.

WebAssembly は主にブラウザ上で使われることを想定しています。

#### In the Browser

https://esbuild.github.io/api/#browser

#### `startService` vs. `initialize`

https://stackoverflow.com/a/66586893

つまり同じ内容を実行する関数名が変更になったよ。

公式には詳しい内容が載っていないので自分で type.d.ts みてってことに。

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

- `initialize()`はブラウザで esbuildAPI を使うときに一番初めに呼出その結果が返ってくるまで他の API を使うことが許されない。
- ブラウザで利用したいときは引数の`options`が必須である。
- `worker`はデフォルトで true である

#### `build`

https://esbuild.github.io/api/#bundle

デフォルトの動作で esbuild は`esbuild.build`呼出をしてもインプットファイルをバンドリングしてくれない。

バンドリングは明示的に指示しなくてはならない: `bundle: true`のように。

インプットファイルに依存関係があれば、esbuild はそれらをたどって依存関係のファイルもバンドリングしていくのでインプットファイルに必要な依存関係が import されていたりするならばすべてのファイルをインプットファイルに書き出す必要はない。

バンドリングは静的な import にのみ有効であるので、動的 import はバンドリングされない。

#### `rebuild`

https://esbuild.github.io/api/#rebuild

build API を継続的に同じオプションで呼び出したいときに使う。

`rebuild`は`build`を何度も呼出すよりも効率的である。

なぜなら前回のビルド内容をキャッシュして毎度比較してくれるからである。

**Filesystem が存在する場合にのみ有効な機能であり、plugins を使うような場合にはキャッシュ機能は使えない**

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

通常は.js は JavaScript、.css は CSS ファイルと解釈するという意味である。

今回は不要かも。

#### outDir

ブラウザ上には Filesystem ないし、コードはファイルではなくて string で受け取るので不要

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

## 実装

## Bundler の実装

#### `esbuild.initialize()`

- esbuild API を使う前に必ず呼び出し、その応答が正常であることを確認すること
- **呼出は一度だけ！**

#### トランスパイリング実装

まとめ：

- `esbuild.initialize()`には`node_modules/esbuild-wasm/esbuild.wasm`が必要だがブラウザからは見えないので`public`ディレクトリ以下に配置する。
- `esbuild.initialize()`は必ず esbuild API を使う前に実行して正常起動したことを確認すること。

次のコードで`esbuild.initialize()`がエラーを起こす。

`Wasm decoding failed: expected magic word 00 61 73 6d, found 3c 21 44 4f @+0`

といった内容の。

```TypeScript
// src/bundler/index.ts
import * as esbuild from 'esbuild-wasm';

interface iBuildResult {
    code: string;
    err: string;
};


const initializeOptions: esbuild.InitializeOptions = {
    // このURLが間違っているのだと思う
    wasmURL:  './node_modules/esbuild-wasm/esbuild.wasm',
    worker: true
};

export const bundler = async (code: string): Promise<iBuildResult> => {
    try {

        // DEBUG:
        console.log("[bundler]");

        // 必ずesbuildAPIを使い始める前に呼出す
        //
        // TODO: errorを出している
        await esbuild.initialize(initializeOptions);

        // DEBUG:
        console.log("[bundler] parameter");
        console.log(code);

        // For a while, test with this transform code.
        const result = await esbuild.transform(code, {
            loader: 'jsx',
            target: 'es2015'
        });

        // DEBUG:
        console.log(result);

        return {
            code: result.code,
            err: ''
        };
    }
    catch(e) {
        if(e instanceof Error) {
            return {
              code: '',
              err: e.message,
            };
          }
          else throw e;
    }
};
```

これは webassembly の初期化に失敗したことを示すエラーで、

要はそんな URL は存在しないから、４０４ notfound の HTML が返されているので

esbuild.initialize()が想定するバイナリじゃなよと言っている。

これは講義でわざわざ node_modules/esbuild-wasm/esbuild.wasm をコピーペーストして public ディレクトリの上に置かないと

ブラウザからは見えないことを示す。

なので、`.wasm`ファイルを public 以下に配置する。

#### ビルド機能の実装 `esbuild.build()`

問題： 現状、ビルドはできない。

原因： アプリケーションはブラウザ上で実行されているが、ブラウザにファイルシステムはなく、esbuild は通常ファイルシステムがあることを前提にビルドする市区無だからである。

`esbuild.build()`を実行すると発生するエラー：

` [ERROR] Cannot read directory ".": not implemented on js`

```TypeScript
import * as esbuild from 'esbuild-wasm';

interface iBuildResult {
    code: string;
    err: string;
};


const initializeOptions: esbuild.InitializeOptions = {
    // `public/esbuild.wasm`
    wasmURL:  '/esbuild.wasm',
    worker: true
};

const buildOptions: esbuild.BuildOptions = {
    entryPoints: ['index.js'],
    // explicitly specify bundle: true
    bundle: true,
    // To not to write result in filesystem.
    write: false,
    // To use plugins which solves import modules.
    plugins: [],
};

export const bundler = async (code: string): Promise<iBuildResult> => {
    try {

        // DEBUG:
        console.log("[bundler]");

        await esbuild.initialize(initializeOptions);

       const result = await esbuild.build(buildOptions);

       if(result === undefined) throw new Error;

       // DEBUG:
       for (let out of result.outputFiles!) {
         console.log(out.path, out.contents, out.text)
       };

       return {
        code: result.outputFiles![0].text,
        err: ''
       }
    }
    catch(e) {
        if(e instanceof Error) {
            return {
              code: '',
              err: e.message,
            };
          }
          else throw e;
    }
};
```

エラー内容：ファイルシステムがないから探せない

- 原因：モジュールの捜索は通常 Filesystem 上で行われるが、ここはブラウザ上である
- 原因：ユーザが入力した import で取り込もうとしているモジュールは、node_modules/等があるわけではないのでそもそもローカルに存在しない

解決策：plguins を利用する。

esbuild の plugins を使えば、

モジュールのパス解決をカスタマイズすることができるためファイルシステムがない環境において、たとえばネットワークから取得するといった機能を追加することができる。

## プラグインの導入

#### [自習] esbuild プラグイン

https://esbuild.github.io/plugins/

> plugins API はビルドプロセスの各所へコードを追加することができる。
> `build` API にのみ適用できて、`transform`には適用できない。

esbuild プラグインは`name`と`setup`の 2 つのプロパティからなるオブジェクトである。

詳しくは公式見た方がヒントを得やすい。

#### 要約 esbuild プラグインのパス解決とモジュールの取得

`esbuild.onResolve()`:

`filter`に一致したパスを見つけたときに、パス解決手段をカスタマイズして、

そのパスはこうやって解決してくださいという内容のオブジェクトを返すことで

esbuild の処理に注文を付けるのである。

```JavaScript
// esbuild.onResolve()

// 抽象的に表現するとこうなる
build.onResolve(
  {filter: string /* コールバックを実行させたいpathを正規表現で指定する */},
  (args: any/* 解析中のモジュールに記述されているモジュールパスなど */) => {

    // argsの内容を利用するなどして名前解決する手段をカスタマイズ

    // 戻り値でfilterでヒットしたpathに対してはこのようにpathを解決せよという
    // esbuildへの注文内容をかえす
    return {
      path: string/* filterでヒットしたpathはここにあるというpathを記述する*/,
      namespace: string /* 任意でそのpathはこのnamespaceに含めると指定させる */
    }
  }
);
```

`esbuild.onLoad()`:

> `onLoad`についているコールバック関数は「external」として認識されていない path/namespace の一意のすべてのペアに対して実行される。

その役割はモジュールの中身を返すこととどうやってそれらを得るかの機能を提供することである。

基本的に filter で指定しない限りは全てのパスに対して onLoad が実行されることになると思う。

(つまり基本的に filter なしでの利用はパフォーマンス上あり得ない)

指定することでそのペアに一致するモジュールは onLoad のコールバックの処理に従ってその中身を取り出される。

ひとまず、エントリポイントの index.js を onResolve, onLoad できるようにした

```TypeScript
// src/bundler/index.ts

import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins';

interface iBuildResult {
    code: string;
    err: string;
};

const initializeOptions: esbuild.InitializeOptions = {
    wasmURL:  '/esbuild.wasm',
    worker: true
};

let isInitialized: boolean = false;


/**
 * @param { string } rawCode - The code that user typed and submitted.
 *
 * */
export const bundler = async (rawCode: string): Promise<iBuildResult> => {
    try {

        // DEBUG:
        console.log("[bundler]");
        console.log(rawCode);

        // 必ずesbuildAPIを使い始める前に呼出す
        if(!isInitialized) {
            await esbuild.initialize(initializeOptions);
            isInitialized = true;
        }

        const buildOptions: esbuild.BuildOptions = {
            entryPoints: ['index.js'],
            // explicitly specify bundle: true
            bundle: true,
            // To not to write result in filesystem.
            write: false,
            // To use plugins which solves import modules.
            plugins: [unpkgPathPlugin(rawCode)],
        };


       const result = await esbuild.build(buildOptions);

       if(result === undefined) throw new Error;

       return {
        code: result.outputFiles![0].text,
        err: ''
       }
    }
    catch(e) {
        if(e instanceof Error) {
            return {
              code: '',
              err: e.message,
            };
          }
          else throw e;
    }
};
```

```TypeScript
// src/bundler/plugins/index.ts
import * as esbuild from 'esbuild-wasm';

/**
 * @param {string} inputCode - ユーザがエディタに入力したコード
 *
 * */
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // -- on resolve --


            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                if(args.path === 'index.js') {
                    return {path: args.path, namespace: 'a'};
                }
            });

            // -- on load --

            build.onLoad({filter: /(^index\.js$)/ }, () => {

                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });
        }
    }
}
```

#### `import`文の解決

unpkg.com を利用し始める。

ということでモジュールを取得し始めるよ。

onResolve は`http://unpkg.com/${package-name}`の URL を esbuild の onResolve の戻り値のオブジェクトに渡せばよい。

onLoad はその URL を fetch すればよい。

ひとまず、いずれのパッケージも`/.*/`のフィルタリングでヒットするはずということで...

#### import/require 文のないモジュールを取得する

テストコード：

```JavaScript
import * as tinyTestPackage from 'tiny-test-pkg';

const app = () => {
  console.log(tinyTestPackage);
};
```

```TypeScript
import * as esbuild from 'esbuild-wasm';
import axios from 'axios';


/**
 * @param {string} inputCode - ユーザがエディタに入力したコード
 *
 *
 * */
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // -- on resolve --

            // エントリポイントのindex.js専用
            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
                if(args.path === 'index.js') {
                    return {path: args.path, namespace: 'a'};
                }
            });

            // npmパッケージ他の解決
            //
            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onResolve /.*/: ");
                console.log(args.path);

                return {
                    namespace: 'a',
                    path: `https://unpkg.com/${args.path}`
                };
            });

            // -- on load --

            build.onLoad({filter: /(^index\.js$)/ }, () => {

                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                const { data, request } = await axios.get(args.path);

                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);
                console.log(data);
                console.log(request);

                return {
                    loader: 'jsx',
                    contents: data
                }
            });
        }
    }
}
```

取得はできた。

#### 相対パスの解決

問題：現状のコードだと相対パスが解決できない。

今、unpkg 経由で取得するパッケージのファイが import/require 文を含んでいたらエラーが起こる。

テストコード：

```JavaScript
import * as mediumTestPackage from 'medium-test-pkg';

const app = () => {
  console.log(mediumTestPackage);
};
```

原因：import 文の相対パスをそのまま解決パスとして使っているからである。

```TypeScript
// src/bundler/plugins/index.ts
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                return {
                    namespace: 'a',
                    path: args.path
                };
            });


            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                const { data, request } = await axios.get(args.path);
                return {
                    loader: 'jsx',
                    contents: data,
                }
            });

            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
                // ...
            });

            build.onLoad({filter: /(^index\.js$)/ }, () => {
              // ...
            });

        }
    }
}
```

このままだと、

パースしているファイルの import 文が`import toUpperCase from './utils'`だと、onResolve()の resolve オブジェクトが`path: "./utils"`になり、

onLoad()が`http://unpkg.com/./utils`にアクセスしようとすることになる。

欲しいのは`http://unpkg.com/medium-test-pkg/utils`である。

なので、

そのパッケージにおいて未解決の相対パスを解決するには、つねに`medium-test-pkg`をつけるようにする。

解決策：`esbuild.OnLoadResult.resolveDir`と`URL`コンストラクタを使う

esbuild の仕組みとして、

onLoad()で`resolveDir`を指定してやると、そのモジュール内での未解決パスを onResolve()するときに、onResolve()のコールバックで受け取るオブジェクトに必ずその`resolveDir`が渡されるようになる。

詳しくは以下の 2 つの自習内容を参照。

```TypeScript
// src/bundler/plugins/index.ts
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
              // ...
            });

            build.onLoad({filter: /(^index\.js$)/ }, () => {
                // ...
            });

            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                return {
                    namespace: 'a',
                    // this will get 'https://unpkg.com/medium-test-pkg/utils'
                    path: new URL(args.path, 'http://unpkg.com/' + args.resolveDir + '/').href
                };
            });

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                const { data, request } = await axios.get(args.path);

                return {
                    loader: 'jsx',
                    contents: data,
                    // pass package name
                    resolveDir: new URL(args.path).pathname
                }
            });
        }
    }
}
```

これで相対パスが解決できるようになった。

#### [自習] ESBUILD `esbuild.OnLoadResult.resolveDir`

https://esbuild.github.io/plugins/#on-load-results

> このモジュールのインポートパスをファイルシステム上の実際のパスに解決するときに使用するファイルシステムディレクトリです。file 名前空間内のモジュールの場合、この値のデフォルトはモジュールパスのディレクトリ部分である。それ以外の場合は、プラグインが提供しない限り、この値のデフォルトは空です。
> プラグインが提供しない場合、esbuild のデフォルトの動作では、このモジュールの import を解決しません。このディレクトリは、このモジュールの未解決のインポートパスに対して実行される on-resolve コールバックにも渡されます。

つまり、

プラグインが`resolveDir`でディレクトリを指定すると、そのモジュールでの未解決 import 文を見つけるたびに、esbuild は onReolsve()の args の`resolveDir`プロパティにそのディレクトリを値として与える。

ファイルシステムがある環境で実行すれば、通常`resolveDir`にはモジュールパスのディレクトリを値として受け取る

ファイルシステムが存在しない環境であれば、`resolveDir`の値は空であり、プラグインが提供することができる。

#### [自習] WEB API `URL`

https://developer.mozilla.org/en-US/docs/Web/API/URL/URL

> `URL()`コンストラクタは、与えた引数で定義される URL を表現する新規の URL オブジェクトを返す

Syntax:

```TypeScript
new URL(
  url: string | URL,
  base?: string | URL | undefined
) => URL
```

Prameters:

`url`:

> 絶対 URL または相対 URL を表す文字列または文字列化子 ( <a> 要素や <area> 要素など) を持つその他のオブジェクト。 url が相対 URL の場合、base は必須であり、ベース URL として使用されます。 url が絶対 URL の場合、指定されたベースは無視されます。

`base`:

> url が相対 URL である場合に使用するベース URL を表す文字列。指定しない場合、デフォルトで未定義になります。

NOTE: URL の構造メモ

http://www.example.com:80/path/to/myFile.html?key1=value&key2=value2#theDocument

ならば

`http`: scheme
`www.example.com`: domain
`:80`: port number
`www.example.com:80`: Authority
`/path/to/myFile.html`: Path to resource
`?key1=value&key2=value2`: Parameters
`#theDocument`: Anchor

例を見た方が速い。

```JavaScript
// Base URLs:
let baseUrl = "https://developer.mozilla.org";

let A = new URL("/", baseUrl);
// => 'https://developer.mozilla.org/'

let B = new URL(baseUrl);
// => 'https://developer.mozilla.org/'

new URL("en-US/docs", B);
// => 'https://developer.mozilla.org/en-US/docs'

let D = new URL("/en-US/docs", B);
// => 'https://developer.mozilla.org/en-US/docs'

new URL("/en-US/docs", D);
// => 'https://developer.mozilla.org/en-US/docs'

new URL("/en-US/docs", A);
// => 'https://developer.mozilla.org/en-US/docs'

new URL("/en-US/docs", "https://developer.mozilla.org/fr-FR/toto");
// => 'https://developer.mozilla.org/en-US/docs'

// Invalid URLs:

new URL("/en-US/docs", "");
// Raises a TypeError exception as '' is not a valid URL

new URL("/en-US/docs");
// Raises a TypeError exception as '/en-US/docs' is not a valid URL

// Other cases:

new URL("http://www.example.com");
// => 'http://www.example.com/'

new URL("http://www.example.com", B);
// => 'http://www.example.com/'

new URL("", "https://example.com/?query=1");
// => 'https://example.com/?query=1' (Edge before 79 removes query arguments)

new URL("/a", "https://example.com/?query=1");
// => 'https://example.com/a' (see relative URLs)

new URL("//foo.com", "https://example.com");
// => 'https://foo.com/' (see relative URLs)


// Chrome Dev toolsで検証
//  絶対パスを渡したとき
$ new URL("https://www.unpkg.com/meidum-test-pkg/")
{
  hash: ""
  host: "www.unpkg.com"
  hostname: "www.unpkg.com"
  href: "https://www.unpkg.com/meidum-test-pkg/"
  origin: "https://www.unpkg.com"
  password: ""
  pathname: "/meidum-test-pkg/"
  port: ""
  protocol: "https:"
  search: ""
}

// 相対パスを渡したとき
$ const u = new URL("./utils", "https://unpkg.com/medium-test-pkg")
{
  hash: ""
  host: "unpkg.com"
  hostname: "unpkg.com"
  href: "https://unpkg.com/utils"
  origin: "https://unpkg.com"
  password: ""
  pathname: "/utils"
  port: ""
  protocol: "https:"
  search: ""
}

// baseURLのリソースパスに続けて、相対パスを続けさせたいとき
// --> リソースパスの末尾にスラッシュを必ずつける
$ const u = new URL("./utils", "https://unpkg.com/medium-test-pkg/")
$ u.href
'https://unpkg.com/medium-test-pkg/utils'
```

url 引数に相対パスを渡すと、base の URL にリソースパスの末尾に

`/`がない場合: リソースパスが相対パスに置き換わる
`/`がある場合: リソースパスの後に続いて相対パスに置き換わる

いずれの場合も`./`や`../`の文字は自動的に削除される(自動的に整形されるといった方が正しいかも)。

#### ネストされたモジュールパスの解決

テストコード：

```JavaScript
import * as test from 'nested-test-pkg';

const app = () => {
  console.log(test);
};
```

問題：ネストしているモジュールのパスの解決は現状できない。

原因：現状、リダイレクトに対応できていないからである。

イメージ図

```
http://unpkg.com/nested-test-pkg
      └──────────src/
                  ├────── index.js
                  └────── helpers/
                            └──────utils.js
```

エラー内容：

```bash
GET https://unpkg.com/nested-test-pkg@1.0.0/helpers/utils 404
```

実は、unpkg でモジュールをリクエストするときにリダイレクトが起こっており、

要求：'http://unpkg.com/nested-test-pkg'

実際：'http://unpkg.com/nested-test-pkg/src/index.js'

へ飛ばされているのである。

今、import 文に`import XXX from './helpers/utils`というパスがあったとしたら

本来'http://unpkg.com/nested-test-pkg/src/helpers/utils'で要求しなくてはならないということである。

今までリダイレクトが問題にならなかった理由：TODO: 要まとめ

解決策：リダイレクト URL を resolveDir へ渡す

axios.get()で返されるオブジェクトの中にはリダイレクトされたときの URL が載っている。

`request.responseURL`これがリダイレクトされたときの URL。

例 `responseURL: "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js"`

以下のようにするとうまいこと`/nested-test-pkg@1.0.0/src/`取得できる。

```bash
$ new URL("./", "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js").pathname
/nested-test-pkg@1.0.0/src/
```

```TypeScript
  build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
      const { data, request } = await axios.get(args.path);

      return {
          loader: 'jsx',
          contents: data,
          // NOTE: updated
          resolveDir: new URL("./", request.responseURL).pathname
      }
  });
```

これで解決できた。

#### 検証：実際の npm パッケージを import させてみる

次のテストコードで実際の NPM パッケージをインポートできるか試す。

テストコード：

```JavaScript
import { createRoot } from 'react-dom/client';
import react from 'react';

const App = () => {
    return (
        <div>
          REACT
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

```bash
# ...
# @ onResolve /.*/
# args.path: react-dom
# args:
{
  importer: "http://unpkg.com/react-dom/client"
  kind: "require-call"
  namespace: "a"
  path: "react-dom"
  pluginData: undefined
  resolveDir: "/react-dom@18.2.0"
}
# ERROR
GET https://unpkg.com/react-dom@18.2.0/react-dom 404
```

`https://unpkg.com/react-dom@18.2.0/client.js`へブラウザで直接アクセスすると次のコードが返される。

```JavaScript
'use strict';

var m = require('react-dom');   // NOTE: ここの解決を図ろうとして404エラー
if (process.env.NODE_ENV === 'production') {
  exports.createRoot = m.createRoot;
  exports.hydrateRoot = m.hydrateRoot;
} else {
  // 中略
}
```

アプリケーションが最終的に生成した次の URL にアクセスしようとしてみると 404 エラーが起こる

`https://unpkg.com/react-dom@18.2.0/react-dom`

問題：

`react-dom@18.2.0/client.js`の import 文を解決しようとして

本来`http://unpkg.com/react-dom`へアクセスするべきところ、

現状`https://unpkg.com/react-dom@18.2.0/react-dom`へアクセスしてしまっている。

原因：

すべてのパッケージを`filter: /.*/`でまかなっているのが問題。

相対パスと通常のパッケージを区別すればよい。

名前解決の時点で区別すればよいので`esbuild.onResolve()`を修正する。

テスターサイト： https://www.regextester.com/109212

相対パスの正規表現：`/^\.+\//`

次の表現に一致する。

`./utils`, `../helers/`

相対パスなしの文字列の正規表現：`/.*/`

次の表現に一致する。

`/modules/helpers`, `test.js`

```TypeScript
// src/bundler/plugins/index.ts

export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // -- on resolve --

            // Solves entry point
            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
                if(args.path === 'index.js') {
                    return {path: args.path, namespace: 'a'};
                }
            });

            // Solves related path
            build.onResolve({ filter: /^\.+\// }, (args: esbuild.OnResolveArgs) => {
                return {
                    namespace: 'a',
                    path: new URL(args.path, 'http://unpkg.com' + args.resolveDir + '/').href
                };
            })


            // Solves file path
            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                return {
                    namespace: 'a',
                    path: `http://unpkg.com/${args.path}`
                };
            });

            // -- on load --

            build.onLoad({filter: /(^index\.js$)/ }, () => {
                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                const { data, request } = await axios.get(args.path);

                return {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL("./", request.responseURL).pathname
                }
            });
        }
    }
}
```

これで解決できた

## css ファイルの解決

現状 index.js 以外のファイルは用意できない。

css もネットワークから取得する必要があるので

'bulma/css/bulma.css'を unpkg.com で引っ張って来る。

#### CSS テストコード

次のテストコード

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

#### css モジュール解決の記録

```bash
Load cached data.
[unpkgPathPlugin] cache new data.
XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, …}
[ERROR] Unexpected "."

    a:http://unpkg.com/bulma/css/bulma.css:3:0:
      3 │ .button, .input, .textarea, .select select, .file-cta,
        ╵ ^
```

原因の特定：

そもそも`http://unpkg.com/bulma/css/bulma.css`はアクセスできるのか？
できる

エラーメッセージを見てみると、css セレクタの前にドットがありそれがおかしいと言っている。

たぶんだけど、`esbuild.OnLoadResult`で`loader: 'jsx'`としているのが原因かも。

このローダーは、

https://esbuild.github.io/plugins/#on-load-results

> これにより、コンテンツの解釈方法が esbuild に伝えられます。たとえば、js ローダーはコンテンツを JavaScript として解釈し、css ローダーはコンテンツを CSS として解釈します。指定されていない場合、ローダーはデフォルトで js になります。

https://esbuild.github.io/content-types/#css

で loader: css について。

ということで、拡張子が`.css`のものは別で load すればいい。

#### 拡張子`.css`正規表現模索

参考：https://stackoverflow.com/a/31473828

/.\.css$/: `.css`にのみマッチする(.css の前の部分はマッチしない)

/\S+\.css$/: 相対パスで拡張子が`.css`にマッチする

/[\w\d]+\.css$/: `xxx.css`にのみマッチする

esbuild plugins の filter は

```TypeScript

// PATTERN 1
const reg = /.\.css$/;

console.log(reg.test("./bulma/css/bulma.css")); // true
console.log(reg.test("bulma.css"));             // true
console.log(reg.test("/bulma/css/bulma.css"));  // true
console.log("./bulma/css/bulma.css".match(reg));    // a.css
console.log("bulma.css".match(reg));                // a.css
console.log("/bulma/css/bulma.css".match(reg));     // a.css

// PATTERN 2
const reg = /\S+\.css$/;

// true
console.log(reg.test("./bulma/css/bulma.css")); // true
console.log(reg.test("bulma.css"));             // true
console.log(reg.test("/bulma/css/bulma.css"));  // true
console.log("./bulma/css/bulma.css".match(reg));    // ./bulma/css/bulma.css
console.log("bulma.css".match(reg));                // bulma.css
console.log("/bulma/css/bulma.css".match(reg));     // /bulma/css/bulma.css

// PATTERN 3
const reg = /[\w\d]+\.css$/;

// true
console.log(reg.test("./bulma/css/bulma.css")); // true
console.log(reg.test("bulma.css"));             // true
console.log(reg.test("/bulma/css/bulma.css"));  // true
console.log("./bulma/css/bulma.css".match(reg));    // bulma.css
console.log("bulma.css".match(reg));                // bulma.css
console.log("/bulma/css/bulma.css".match(reg));     // bulma.css

```

ということで、pattern 2 が正しい表現である。

```TypeScript
build.onLoad({filter: /\S+\.css$/ }, async (args: esbuild.OnLoadArgs) => {
    // DEBUG:
    console.log("[unpkgPathPlugin] onLoad packages :" + args.path);

    let result: esbuild.OnLoadResult = {};
    // Anyway load cached data.
    const cachedResult = await cacheDB.getItem<esbuild.OnLoadResult>(args.path);
    if(cachedResult) {
        // DEBUG:
        console.log("[unpkgPathPlugin] Load cached data.");
        result = cachedResult;
    }
    else {
        const { data, request } = await axios.get(args.path);

        // DEBUG:
        console.log("[unpkgPathPlugin] cache new data.");
        console.log(request);

        result = {
            loader: 'css',
            contents: data,
            resolveDir: new URL("./", request.responseURL).pathname
        }
        cacheDB.setItem<esbuild.OnLoadResult>(args.path, result);
    }
    return result;
});
```

#### `onLoad()`の`loader: css`は解決策にならない

上記のコードを適用したアプリケーションで次のエラー

```bash
✘ [ERROR] Cannot import "a:http://unpkg.com/bulma/css/bulma.css" into a JavaScript file without an output path configured

    a:index.js:3:7:
      3 │ import 'bulma/css/bulma.css';
        ╵        ~~~~~~~~~~~~~~~~~~~~~
```

> 出力パスが設定されていない JavaScript ファイルに "a:http://unpkg.com/bulma/css/bulma.css "をインポートすることはできません。

もう一度公式の説明を見る。

https://esbuild.github.io/content-types/#css-from-js

> CSS ファイルを JavaScript ファイルからインポートすることができる。その場合、そのエントリポイントの JS ファイルが参照しているすべての css ファイルをバンドルして、その js ファイルが出力されたファイルの隣に出力する。`app.js`が参照するすべての css ファイルは、`app.js`の隣に`app.css`として出力されるということ。

つまり、`onLoad()`で`loader: css`を指定すると、css ファイルが出力されることになるため、ブラウザ上だとファイルシステムがないから解決できないことになる。

#### `<style>`への CSS 内容の埋め込み

TODO: 実施した内容をまとめておくこと。

## When I should escape HTML?

TODO: HTML エスケープに関しては、セキュリティの本を読め

想定場面：

esbuild.onLoad()で module の中身をサーバから取得するのだけれど、

その module の中身を文字列にして、

JavaScript で HTML へ埋め込む操作を行う。

その時に module の中身は HTML エスケープするべきなのかどうか。

HTML エスケープについては、セキュリティの本を読んだ方が体系的に学べるので、そちらに一任しましょう。

ということで実装はそのまま講義の通りにすればいいかと。

```TypeScript
const style = `
    const style = document.createElement('style');
    style.innerText = '${cssContent}';
    document.head.appendChild(style);
`;
```

とするので、

cssContent の中に`'`があると予期せず文字列が途切れて以降が意味不明なコードになってしまう。

そのためエスケープする必要があるのだ。

#### CSS モジュール解決実装のまとめ

- ESBuild は通常、css ファイルを出力するがブラウザ上なのでファイル出力できない
  onLoad()で`loader: css`を選択すると css ファイルを出力するので、loader を変更しても解決にならない

- css モジュールの内容は HTML`<style>`を生成してその中に埋め込むことにする

## 実装：キャッシュ機能

どうしてキャッシュ機能を設けるの？何とトレードオフなのか？

どうやってキャッシュ機能を設計するの？スタンダードとかあるの？

#### クライアント側ストレージ

https://developer.mozilla.org/ja/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage

> 現代のブラウザーは、ウェブサイトがユーザーの許可を得た上で、ユーザーのコンピューターにデータを格納し、必要なときにそれを取得するためのさまざまな方法に対応しています。これにより、データを長期保存したり、サイトや文書をオフラインで使用するために保存したり、サイトのユーザー固有の設定を保持したりと、さまざまなことが可能になります。

昔はセッション ID やアクセストークンを格納するために使われるクッキーが、データを保存するために利用されていたりしたらしいが、最近はクッキー以外の方法が使用されている。

とにかく、クライアント側で使えるストレージが以下の通り：

- Cookie
- web storage API (localstorage, sessionstorage)
- IndexedDB API
- Cache API

普及率が高いというわけではないが

- Web SQL

というものが存在しますと。

#### Cache API

https://developer.mozilla.org/ja/docs/Web/API/Cache

> キャッシュ API は、特定のリクエストに対する HTTP レスポンスを格納するために設計されており、ウェブサイトの資産をオフラインで格納し、その後ネットワーク接続なしでサイトを使用できるようにするようなことを行うのに、とても有用です。

使いどころ：HTTP Request/Response のペアを保存するために使う。Web Worker で利用することができる。

普及率は６０％くらい？

高度な内容っぽい。

#### Web storage API

https://developer.mozilla.org/ja/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage

> ウェブストレージ API はとても簡単に使えます。（文字列や数などに限定された）データからなる単純な名前／値のペアを保存し、必要なときにその値を取り出します。

LocalStorage と SessionStorage の２種類がある。

保存できるデータは key-value ペアのデータで JSON メソッドを使って JSON 形式で保存・取り出しがされる。

API を使ってデータを取り出すためには`key`を与えて検索する方式。

key-value 方式でしかデータを保存できないので構造化されたブジェクトなんかの保存には向かない。

そのため簡単な小さなデータを保存するのに向いており、大きく複雑なデータを保存するのには向いていない。

web ページが読み込まれても、場合によってはブラウザが終了してもデータが持続することができる。

ストレージはドメインごとに独立している。そのため web サイトごとにデータが管理されるため異なるドメインから異なるドメインのデータを取得することはできない。

#### IndexedDB API

> IndexedDB API （ときには IDB と省略します）は、ブラウザーで利用可能であり、複雑で関係性のあるデータを保存できる、完全なデータベースシステムです。そのデータの型は、文字列または数値のような単純な値に限定されません。動画や静止画像、そして、その他のものもほとんどすべて、 IndexedDB インスタンスに保存することができます。

その代わり扱いが難しいとのこと。

参考：

https://stackoverflow.com/questions/5924485/how-is-indexeddb-conceptually-different-from-html5-local-storage

#### LocalStorage (sessionstorage)

https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

> ストレージ・オブジェクトは、オブジェクトに似た単純なキー・バリュー・ストアですが、ページロード中もそのままの状態を保ちます。キーと値は常に文字列です（オブジェクトと同様に、整数のキーは自動的に文字列に変換されることに注意してください）。これらの値には、オブジェクトのようにアクセスするか、Storage.getItem()および Storage.setItem()メソッドを使用することができます。

- 少量しか保存できない
- 文字列データしか扱えない
- key 検索しかできない

#### 自作 or NPM package

まぁありものを使いましょう。

結局人気でも週刊ダウンロード数でも localforgae が一番。

#### localforage で IndexedDB

https://github.com/localForage/localForage

https://localforage.github.io/localForage/

非同期 API である。

IndexedDB や web sql 非対応のブラウザの場合、localstorage コンパチブルの API を提供する。

要は IndexedDB を簡便に使うためのものである。

なんだか API ページでは key で欲しい奴を探してねって感じだけど、

扱いたいデータはオブジェクトなので key で探すとは限らないのだが...

どんなデータが扱えるのだ？

今扱いたいデータ

```TypeScript
/**
 * @property {string} path - unpkg.com/へ続くリソースパス
 * @property {string} content - そのリソースパスのファイルの中身等の情報がつまったesbuildのonLoad()戻り値
 * */
interface iCachedModule {
    // path of resources which is part of url.
    path: string;
    // Fetched content data.
    onLoadResult: esbuild.OnLoadResult;
};
```

#### Usage

```TypeScript
// src/storage/index.ts

import localforage from 'localforage';

/***
 * NOTE: いかなるlocalforageのAPIを使うよりも前に呼び出さなくてはならない。
 *
 * */
localforage.config({
    // 使用する優先ドライバー。他にlocalstorageやwebsqlもあるっぽい。
    driver: localforage.INDEXEDDB,
    // localStorage では、これは localStorage に格納されているすべてのキーのキー プレフィックスとして使用されます。
    name: "my-jbook",
    // size: web sqlを使うなら指定できる
    // データストアの名前
    storeName: "my_jbook_ds",
    // スキーマバージョン番号。1.0とする以外使わない。
    version: 1.0,
    description: "indexeddb for my-jbook app"
});

export const createDBInstance = (configs: LocalForageOptions): LocalForage => {
    return localforage.createInstance(configs);
};

// src/bundler/plugins/index.ts

const cacheDB: LocalForage = createDBInstance({
    name: 'modules cache'
});


export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // ...

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);

                let result: esbuild.OnLoadResult = {};
                // Anyway load cached data.
                const cachedResult = await cacheDB.getItem<esbuild.OnLoadResult>(args.path);
                if(cachedResult) {
                    // DEBUG:
                    console.log("[unpkgPathPlugin] Load cached data.");
                    result = cachedResult;
                }
                else {
                    const { data, request } = await axios.get(args.path);

                    // DEBUG:
                    console.log("[unpkgPathPlugin] cache new data.");
                    console.log(request);

                    result = {
                        loader: 'jsx',
                        contents: data,
                        resolveDir: new URL("./", request.responseURL).pathname
                    }
                    cacheDB.setItem<esbuild.OnLoadResult>(args.path, result);
                }
                return result;
            });
        }
    }
}
```

## wasm module のローディング

`/public/esbuild.wasm`ではなくネットワークから引っ張って来るようにする。

TODO: 行った内容をまとめておくこと

## Preview の実装

ユーザが入力したコードの

#### iframe

https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe

https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies

#### ユーザが入力しうる危険なコードの候補

- ユーザが入力するコードがもたらすエラーでアプリケーションをクラッシュさせる可能性がある
- ユーザが入力するコードが DOM を変更してクラッシュが起こりうるかも
- ユーザが入力するコードが第三者からもたらされたもので、悪意のあるコードである可能性がある

#### iframe のテスト

```TypeScript
// src/components/code.tsx
export const Code = () => {
    return (
        <div>
            // Need public/test.html
            <iframe src="/test.html"></iframe>
        </div>
    );
}
```

後はコンソールなりで通信する方法を試してみる

#### 閲覧コンテキスト間通信の方法一覧

参考：

https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#scripting

https://stackoverflow.com/a/9154267

直接のやり取り

- `iframe`が`sandbox`プロパティを持たないとき、または`sandbox="allow-same-origin"`プロパティを持つとき

- その`iframe`と全く同じドメイン、ポート、プロトコルからの通信された場合にのみフレーム間で直接アクセスできる

間接のやり取り

`window.postMessage()`なら、制限のある環境同士の通信は可能と MDN に書いてあった。

直接の通信方法のまとめ：

- `window.frames`
- `iframeElement.contentWindow`
- `window.parent`

#### 検証 1：制限なし && 同一オリジン

親・iframe 各コンテキストのオリジンは localhost:3000 である

```bash
# In chrome DevTools console
# 通常のコンテキストの違いの確認
#
# Choosing parent context
> window.a = 1
> const color = "red"
> window.a
1
> color
red

# Change context to embedded context
> window.a
Error window.a is not exist
> color
Error color is not exist
# parentを使うと親環境のオブジェクトを取得できてしまう！
> parent.a
1
> window.b = 2
2

# Change context to parent context
> window.b
undefined       # 親が子の定義したものを取得できないけれど...
```

```bash
# `iframeElement.contentWindow`で取得する方法の確認
#
# (子環境)
$ window.d = "DDD"
 'DDD'
$ d
 'DDD'
# (親環境)
$ d
 VM772:1 Uncaught ReferenceError: d is not definymous>:1:1
(anonymous) @ VM772:1
$ window.d
 undefined
$ document.querySelector('iframe').contentWindow
 Window {window: Window, self: Window, document: document, name: '', location: Location, …}
$ document.querySelector('iframe').contentWindow.d
 'DDD'  # アクセスできた
```

```bash
# `window.parent`で、子環境から親環境へアクセスできるかの確認
#
# In test.html (iframe) context
$ window.parent
Window {...}    # これは親コンテキストで実行しても同じ
$ window.parent.a
111             # 先で親コンテキストで定義した変数aにアクセスできる
$ window.parent.document.querySelectorAll('button');
NodeList[button]    # このようにdocumentでアクセスもできる

# 一方、親環境から子環境へアクセスすることはできない
#
$ window.b = "this is B"
# (親環境へ切り替え)
$ window.b
undefined
$ window.parent.b
undefined
```

```bash
# `window.frames`を使ったアクセス方法の確認
#
# (子環境)
 $ window.e = "eee"
 'eee'
 $ e
 'eee'
# (親環境)
 $ window.f = "ffffuccc"
 'ffffuccc'
 $ f
 'ffffuccc'
 $ window.frames
 $ window.frames.e
 undefined
 $ window.frames.length
 1
 $ window.frames[0].e
 'eee'
```

実は、特に制限しない限り親環境と子環境は相互に通信できてしまう。

まとめ：

- `window.parent`を使えば、子コンテキストから親コンテキストへアクセスすることができる。その逆はできない。
- `iframeElement.contentWindow`を使えば、親コンテキストから子コンテキストへアクセスすることができる。
- `window.frames`はカレントウィンドウのサブフレームの疑似配列を返し、`window.frames[0]`等のように使うことによってすべてのサブフレームへアクセスすることができる。

#### 検証２：制限有 && 同一オリジン

sandbox は...

- 値なし`sandbox`属性はすべての制限を設けるという意味になる
- `sandbox: allow-XXX`で、その制限が解除される
- `allow-scripts`と`allow-same-origin`の両方を設けてはならない。

`sandbox`:

> 追加の制限を、iframe の中身に対して設けることができる。この属性の値は省略することができ、その場合すべての制限を設けるということになる。特定の制限を解除するためにスペースで区切られたトークンにすることができます

NOTE: 注意

> 埋め込み文書が埋め込みページと同じオリジンを持つ場合、allow-scripts と allow-same-origin の両方を使用することは強く推奨されません。それ等の組み合わせは`sandbox`属性を除去してしまうため、`sandbox`属性だけ使う場合よりもはるかに危険な状況になってしまいます。

> サンドボックスは、攻撃者がサンドボックス化された iframe の外側にコンテンツを表示できる場合（視聴者が新しいタブでフレームを開いた場合など）、意味がありません。このようなコンテンツは、潜在的な被害を抑えるために、別のオリジンから提供する必要があります。

検証）`sandbox`で全ての制限を設けられるとのことなので、先の検証と同じ実験を`sandbox`アリで実行してみる:

```bash
# (親環境)
$ window.a = 111
$ a
111
# (子環境)
$ window.b = "BBB"
$ b
BBB
# 親環境へアクセスしてみる
$ window.parent.a
Uncaught DOMException: Blocked a frame with origin "null" from accessing a cross-origin frame.
# アクセスできなかった
#
# (親環境)
#
$ document.querySelector('iframe').contentWindow.b
VM232:1 Uncaught DOMException: Blocked a frame with origin "http://localhost:3000" from accessing a cross-origin frame.
# アクセスできなかった
#
# window.framesを試してみる
$ window.frames.length
1
$ window.frames[0].b
Uncaught DOMException: Blocked a frame with origin "http://localhost:3000" from accessing a cross-origin frame.
```

結果）先の検証のアクセス方法はすべてブロックされた。

`sandbox`を設けておけばアクセスはできなくなるということは確かに確認できた。

#### 検証 3：制限無し && 非同一オリジン

NOTE: 検証のために、一時的にオリジンを変更する

```bash
# /etc/hostsを上書きする (次回起動時には元通りになるので安心してくれ)
$ sudo vim /etc/hosts
# ADD: 127.0.0.1 nothing.localhost
# and save it.
```

```TypeScript
export const Code = () => {
    return (
        <div>
            <iframe
                // Give new utl that domain is new domain which on /etc/hosts
                src="http://nothig.localhost:3000/test.html"
                // sandbox=""
            />
        </div>
    );
}
```

検証）「その`iframe`と全く同じドメイン、ポート、プロトコルからの通信された場合にのみフレーム間で直接アクセスできる」の確認

chrome devtools の network タブで確認したところ、`test.html`のオリジンは先で指定した通りになっている。

結果）確かにアクセスできなかったことが確認できた

```bash
# (親環境)
$ window.abc = "abc"
 'abc'
$ abc
 'abc'
# (子環境)
$ window.xyz = "xyz"
 'xyz'
$ xyz
 'xyz'
$ window.parent.abc
 VM152:1 Uncaught DOMException: Blocked a frame with origin "http://nothig.localhost:3000" from accessing a cross-origin frame.
    at <anonymous>:1:15
(anonymous) @ VM152:1
# (親環境)
$ document.querySelector('iframe').contentWindow.xyz
 VM257:1 Uncaught DOMException: Blocked a frame with origin "http://localhost:3000" from accessing a cross-origin frame.
    at <anonymous>:1:47
(anonymous) @ VM257:1
$ window.frame
 1
$ window.frames[0].xyz
 VM343:1 Uncaught DOMException: Blocked a frame with origin "http://localhost:3000" from accessing a cross-origin frame.
    at <anonymous>:1:18
(anonymous) @ VM343:1
```

#### まとめ：`iframe`と親環境のアクセス条件

- 同一オリジン、且つ`sandbox`なしの`iframe`に対しては、`window.frames`,`iframeElement.contentWindow`,`window.parent`で相互にアクセスすることができる。
- 値なし`sandbox`属性アリの`iframe`ならばお互い一切のアクセスはできなくなる。
- 非同一オリジンであれば`sandbox`なしでも、どちらからでもアクセスが出来なくなる

#### どうやってフレーム間通信を実現するか

- iframe and parent context are same origin.

- set sandbox attribute with no value on iframe

- user provides js codes

- user submits it

- submitted code is caught and send to iframe of preview by targetIFrame.postMessage()

- iframe get message by `message` event listener and pass code to srcDoc attirbute

- render it

これで、

`sandbox`が有効なのでお互いアクセスはできない。

`window.postMessage()`は送信対象を制限できるので任意の送信先以外に送信されない。

iframe 側は受け取るメッセージをチェックできる。

`srcDoc`は埋め込み HTML を与えるために使うので`srcDoc`へ送信されたコードを埋め込む。

#### 関節通信 `window.postMessage()`

> window.postMessage()メソッドは、Window オブジェクト間のクロスオリジン通信を安全に可能にします。例えば、ページとそれが生成したポップアップ、またはページとその中に埋め込まれた iframe の間などです。

> 通常、異なるページのスクリプトは、それらが発信されたページが同じプロトコル、ポート番号、およびホストを共有する場合にのみ、互いにアクセスすることが許可されます（「同一起源ポリシー」としても知られています）。window.postMessage()は、（適切に使用されていれば）この制限を安全に回避する制御機構を提供します。

> 大まかには、あるウィンドウが別のウィンドウへの参照を取得し（例えば、targetWindow = window.opener を介して）、targetWindow.postMessage()でそのウィンドウに MessageEvent をディスパッチすることができます。その後、受信側のウィンドウは、必要に応じてこのイベントを自由に処理することができます。window.postMessage()に渡された引数（つまり「メッセージ」）は、event オブジェクトを通じて受信ウィンドウに公開されます。

ということで、まずは送信対象の window オブジェクトを取得する必要がある

これには ref を利用する。

## JavaScript 文字列コードを実行させる方法

iframe の srcDoc へ、JS コードなどを埋め込んだ文字列を渡すことで JS コードを実行させる。

srcDoc は JS コードだけを渡すのではなく、`script`タグを含め、その中に JS コードを埋め込む。

そのため、

- `<script>${jscode}</script>`とするのか
- `<script>window.addEventListener('message', () => eval(jscode))</script>`とするのか

の 2 つの手段がある。

となると強く懸念されることとして eval()を使っている点が挙げられる。

なんとか script タグへの埋め込みを採用したいが...

#### なぜ script タグへの埋め込みではだめなのか

結論：ブラウザは`<script>`タグのネストを認めていないから

---

講義では、文字列の埋め込みなので、モジュールの方に`</script>`があると

勝手に script タグを閉じてしまうので途中で切られたモジュールの後半のコードが

インバリッド判定を受けるからという指摘。

TEST@codesandbox

```TypeScript
// src/components/editor
import { useState, useEffect, useRef } from 'react';
import { bundler } from '../bundler';

// HTMLエスケープ含めているけど特に意味はないです
const escapeHtml = (code: string): string => {
  return code
  .replace(/\n/g, '')
  .replace(/"/g, '\\"')
  .replace(/'/g, "\\'");
};


const Editor = () => {
    const previewFrame = useRef<any>();
    const [input, setInput] = useState<string>('');
    const [code, setCode] = useState<string>('');

    useEffect(() => {
        // DEBUG:
    }, []);


    const htmlTemplate = `
    <html>
      <head></head>
      <body>
        <div id="root">
          <script>
            ${code}
          </script>
        </div>
      </body>
    </html>
    `;

    const onClick = async () => {

        const result = await bundler(input);
        // HTMLエスケープさせる関数でHTMLエスケープさせたコードを埋め込む
        setCode(escapeHtml(result.code));
    };

    return (
        <div className="editor-form">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={onClick}>Submit</button>
            <pre>{code}</pre>
                <iframe
                    ref={previewFrame}
                    srcDoc={htmlTemplate}
                    sandbox="allow-scripts"
                />
        </div>
    );
};

export default Editor;
```

```JavaScript
// textareaへ入力したコード
import reactDOM from 'react-dom';

// ...
```

```bash
# 発生するエラー
Uncaught Syntax Error: Invalid or unexpected token
```

講義中の Q&A で回答が

原因は「`script`タグはネストできないから！」とのこと

さらに示された good post of stackoverflow

https://stackoverflow.com/questions/6322541/nested-javascript-templates-is-this-possible-valid

つまり、

```JavaScript
const html = `
    <script>
        ${code}
    </script>
`;

// If code is like this...
const html = `
    <script>
        // ....
        </script>   // Browser stops parsing here and quit reading rest.
        // ...
    </script>
`;
```

つまり、

もしも code の内容が上記のように`</script>`を含むと、

ブラウザは自動的にそこで script コードの読み込みを終了してしまうとのこと。

なのでたとえ上記のように`script`タグがネストしていても関係ないのである。

これはブラウザの振る舞いなので、

サーバへ入力コードを送信してそこから変換されてブラウザへ帰されるような場合は

変換次第ではどうにかできるのかも。

ただし私同様に script タグのエスケープが不要だった人もいた模様で esbuild-wasm のバージョンの問題なのかしら？

とにかくブラウザの仕様に合わせるべく講義の通り postMessage() + eval()にするのか...

#### Why eval() is evil

参考：

https://stackoverflow.com/a/86580

https://stackoverflow.com/a/198031

主に 2 点：効率の悪いパフォーマンスとコードインジェクションの危険性

eval()の特徴は、

- eval()はグローバルオブジェクトの関数プロパティである(window.eval()ってことかしら？）

  通常 eval()の評価文はローカルスコープで実行されるが、
  eval()を、`eval()`以外の名前を参照して呼び出すと、ES5 以降の場合 eval()の評価した文字列はグローバルスコープで評価される。
  評価されたコードはその呼び出されたスコープ内のローカル変数にアクセスできなくなる、ということ

- eval()は**呼び出し元の権限**で、eval()へ渡されたコードを実行する

  権限というのは Linux のパーミッションのことのようで、
  例えばこれがサーバサイドで eval()すると、サーバの上位の権限において`rm -rf /etc/important-file`を実行する悪意に満ちたコードを実行される危険性がある

- コードインジェクションの危険性
- debug が困難である

- 非常に低速である

  JS エンジンでコードを実行するよりも遅い。特に現代の JavaScript は機械語に変換されるため、機械語の中では変数の概念は消えており、eval()はその機械語から改めてどこに変数があるのか検索することになり、非常に高価なパフォーマンスを支払うことになる。

TODO: 書籍でこの件を取り扱っていると思うから底学習したらまとめる。

制限：js コード文字列は postMessage()経由で取得するとする

```TypeScript
const html = `
    <html>
        <head></head>
    </html>
    <body>
        <script>
            try {
                window.addEventListener('message', (e) => {
                    const { data } = e;
                    eval(data.code);
                    // vs.
                    // new Function(data.code);
                });
            }
            catch(e) {
                // Display error
            }
        </script>
    </body>
`

const Cell = (props) => {
    const ref = useRef<any>();
    const [input, setInput] = useState<string>('');

    const clickHandler = (e) => {
        ref.current.contentWindow.postMessage({ code: input } ,'*');
    }

    return (
        <div>
            <textarea onChange={(e) => setInput(e.target.value)} value={input} />
            <button onClick={clickHandler} >submit</button>
            <iframe ref={ref} sandbox="allow-scripts" srcDoc={html} />
        </div>
    );
}
```

#### postmessage with eval() vs embedding js code directory

AST parser を使ってみては？という提案を発見

## React

#### Ref Forwarding

https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes

解決したい問題：子コンポーネントを参照したいので、ユーザ定義コンポーネントへ ref を渡したい

```TypeScript
import { Code } from './Code';

const Editor = () => {
    const previewFrame = useRef<any>(null);

    const onClick = async () => {

        // ...

        previewFrame.current.postMessage({
            code: result.code
        })
    };

    return (
        // ...
        <Code ref={previewFrame} /> // ERROR!
    );
};
```

原因）

ref は本来 DOM node へ対して利用できるもので、ユーザ定義のコンポーネントは DOM node ではないため。

> これは、React のデフォルトでは、コンポーネントが他のコンポーネントの DOM ノードにアクセスできないために起こります。自分の子でさえもです！これは意図的なものです。Ref は逃げ道であり、控えめに使うべきものです。他のコンポーネントの DOM ノードを手動で操作すると、コードがさらに壊れやすくなります。

つまり、

組み込みコンポーネントの`<input ref={ref}/>`はできるけれど、ユーザ定義コンポーネントの`<Input ref={ref} />`は出来ないということ。

解決方法）

> その代わりに、DOM ノードを公開したいコンポーネントは、その動作を選択する必要があります。コンポーネントは、その子コンポーネントの 1 つに ref を「転送」するよう指定することができます。以下は、MyInput が forwardRef API を使用する方法です：

つまり、

useRef の戻り値をユーザ定義コンポーネントの prop として渡す
&&
ユーザ定義コンポーネントを`React.forwardRef()`でラップする

ことで ref をバケツリレーできるようになる。

#### RefFowarding を使わないといけないのか？

結論：公式ドキュメントでは RefForwarding は一つのオプションであると明記されている

https://legacy.reactjs.org/docs/forwarding-refs.html

> Ref forwarding is a technique for automatically passing a ref through a component to one of its children. **This is typically not necessary for most components in the application.** ...

#### `React.forwardingRef()`の注意

ユーザ定義コンポーネントへ ref を渡すとき、ref 属性はユーザ定義の名前にしてはならない。

```TypeScript
// 親コンポーネント
    // <Preview previewFrame={previewFrame} />
    <Preview ref={previewFrame} />

// 子コンポーネント
export const Preview = forwardRef((
    props: any,
    previewFrame: any   // こっちはネーミング可能
) => {
    return (
        <>
            <iframe
                ref={previewFrame}
                srcDoc={html}
                sandbox="allow-scripts"
                {...props}
            />
        </>
    );
});
```

#### Ref と DOM

`ref`は

- React において DOM を参照する手段である。

つまり、React では`document.querySelector()`の代わりに ref を使えということだ。

- prop を使わないでコンポーネントを変更するとき

ただし使いすぎるな。

- 親コンポーネントへ子コンポーネントの DOM を参照（公開）する手段

非推奨の手段である。なぜならカプセル化が破られるから。

React16.3 以降なら`RefForwarding`の仕様を推奨するとのこと。

つまり、`RefForwarding`の仕様は必須ではないけれど、この場合では推奨であるということだ。
