# 開発メモ

講義で作成するアプリケーションを、ノートを基に一から自分で作成する。

## 目次

- [自習](#自習)
- [実装](#実装)

## ブラウザでトランスパイリング、バンドリング

トランスパイリング：モダンな記法をES5以前の記法に変換する処理のこと。Babelがやっていること。

バンドリング：依存関係の解決。一つのファイルに出力する。Webpackとかがやっていること。

今回のアプリケーションはブラウザ上でバンドリングをするか、サーバ上でバンドリングする。

いずれにしても、

- ユーザが要求する予測不能のパッケージをインポートできなくてはならない
- ブラウザ上だとファイルシステムがない

普通バンドリングは開発中に使うもので、アプリケーションの機能として使う場合常にブラウザで使うことを念頭に置かなくてはならない。

## 自習

#### Webpack Concepts

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

#### ESbuild

#### WASM Version

https://esbuild.github.io/getting-started/#wasm

esbuild-wasmはとても遅い。

> The WebAssembly package is primarily intended to only be used in the browser.

WebAssemblyは主にブラウザ上で使われることを想定しています。

#### In the Browser

https://esbuild.github.io/api/#browser



## [参考] JavaScript Module Systems Showdown: CommonJS vs AMD vs ES2015

時間があれば。



#### `startService` vs. `initialize`

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


## 実装

## Bundlerの実装

#### `esbuild.initialize()`

- esbuild APIを使う前に必ず呼び出し、その応答が正常であることを確認すること
- **呼出は一度だけ！**


#### トランスパイリング実装

まとめ：

- `esbuild.initialize()`には`node_modules/esbuild-wasm/esbuild.wasm`が必要だがブラウザからは見えないので`public`ディレクトリ以下に配置する。
- `esbuild.initialize()`は必ずesbuild APIを使う前に実行して正常起動したことを確認すること。

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
これはwebassemblyの初期化に失敗したことを示すエラーで、

要はそんなURLは存在しないから、４０４notfoundのHTMLが返されているので

esbuild.initialize()が想定するバイナリじゃなよと言っている。

これは講義でわざわざnode_modules/esbuild-wasm/esbuild.wasmをコピーペーストしてpublicディレクトリの上に置かないと

ブラウザからは見えないことを示す。

なので、`.wasm`ファイルをpublic以下に配置する。

#### ビルド機能の実装 `esbuild.build()`

問題： 現状、ビルドはできない。

原因： アプリケーションはブラウザ上で実行されているが、ブラウザにファイルシステムはなく、esbuildは通常ファイルシステムがあることを前提にビルドする市区無だからである。

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

- 原因：モジュールの捜索は通常Filesystem上で行われるが、ここはブラウザ上である
- 原因：ユーザが入力したimportで取り込もうとしているモジュールは、node_modules/等があるわけではないのでそもそもローカルに存在しない

解決策：plguinsを利用する。

esbuildのpluginsを使えば、

モジュールのパス解決をカスタマイズすることができるためファイルシステムがない環境において、たとえばネットワークから取得するといった機能を追加することができる。

## プラグインの導入

#### [自習] esbuild プラグイン

https://esbuild.github.io/plugins/

> plugins APIはビルドプロセスの各所へコードを追加することができる。
> `build` APIにのみ適用できて、`transform`には適用できない。

esbuildプラグインは`name`と`setup`の2つのプロパティからなるオブジェクトである。

詳しくは公式見た方がヒントを得やすい。

#### 要約 esbuildプラグインのパス解決とモジュールの取得

`esbuild.onResolve()`:

`filter`に一致したパスを見つけたときに、パス解決手段をカスタマイズして、

そのパスはこうやって解決してくださいという内容のオブジェクトを返すことで

esbuildの処理に注文を付けるのである。

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

> `onLoad`についているコールバック関数は「external」として認識されていないpath/namespaceの一意のすべてのペアに対して実行される。

その役割はモジュールの中身を返すこととどうやってそれらを得るかの機能を提供することである。

基本的にfilterで指定しない限りは全てのパスに対してonLoadが実行されることになると思う。

(つまり基本的にfilterなしでの利用はパフォーマンス上あり得ない)

指定することでそのペアに一致するモジュールはonLoadのコールバックの処理に従ってその中身を取り出される。

ひとまず、エントリポイントのindex.jsをonResolve, onLoadできるようにした

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

unpkg.comを利用し始める。

ということでモジュールを取得し始めるよ。

onResolveは`http://unpkg.com/${package-name}`のURLをesbuildのonResolveの戻り値のオブジェクトに渡せばよい。

onLoadはそのURLをfetchすればよい。

ひとまず、いずれのパッケージも`/.*/`のフィルタリングでヒットするはずということで...

#### import/require文のないモジュールを取得する

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

今、unpkg経由で取得するパッケージのファイがimport/require文を含んでいたらエラーが起こる。

テストコード：

```JavaScript
import * as mediumTestPackage from 'medium-test-pkg';

const app = () => {
  console.log(mediumTestPackage);
};
```

原因：import文の相対パスをそのまま解決パスとして使っているからである。

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

パースしているファイルのimport文が`import toUpperCase from './utils'`だと、onResolve()のresolveオブジェクトが`path: "./utils"`になり、

onLoad()が`http://unpkg.com/./utils`にアクセスしようとすることになる。

欲しいのは`http://unpkg.com/medium-test-pkg/utils`である。

なので、

そのパッケージにおいて未解決の相対パスを解決するには、つねに`medium-test-pkg`をつけるようにする。

解決策：`esbuild.OnLoadResult.resolveDir`と`URL`コンストラクタを使う

esbuildの仕組みとして、

onLoad()で`resolveDir`を指定してやると、そのモジュール内での未解決パスをonResolve()するときに、onResolve()のコールバックで受け取るオブジェクトに必ずその`resolveDir`が渡されるようになる。

詳しくは以下の2つの自習内容を参照。

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

> このモジュールのインポートパスをファイルシステム上の実際のパスに解決するときに使用するファイルシステムディレクトリです。file名前空間内のモジュールの場合、この値のデフォルトはモジュールパスのディレクトリ部分である。それ以外の場合は、プラグインが提供しない限り、この値のデフォルトは空です。
> プラグインが提供しない場合、esbuild のデフォルトの動作では、このモジュールの import を解決しません。このディレクトリは、このモジュールの未解決のインポートパスに対して実行される on-resolve コールバックにも渡されます。

つまり、

プラグインが`resolveDir`でディレクトリを指定すると、そのモジュールでの未解決import文を見つけるたびに、esbuildはonReolsve()のargsの`resolveDir`プロパティにそのディレクトリを値として与える。

ファイルシステムがある環境で実行すれば、通常`resolveDir`にはモジュールパスのディレクトリを値として受け取る

ファイルシステムが存在しない環境であれば、`resolveDir`の値は空であり、プラグインが提供することができる。


#### [自習] WEB API `URL`

https://developer.mozilla.org/en-US/docs/Web/API/URL/URL

> `URL()`コンストラクタは、与えた引数で定義されるURLを表現する新規のURLオブジェクトを返す

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

NOTE: URLの構造メモ

http://www.example.com:80/path/to/myFile.html?key1=value&key2=value2#theDocument

ならば

`http`:             scheme
`www.example.com`:  domain
`:80`:              port number
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

url引数に相対パスを渡すと、baseのURLにリソースパスの末尾に

  `/`がない場合:  リソースパスが相対パスに置き換わる
  `/`がある場合:  リソースパスの後に続いて相対パスに置き換わる

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

実は、unpkgでモジュールをリクエストするときにリダイレクトが起こっており、

要求：'http://unpkg.com/nested-test-pkg'

実際：'http://unpkg.com/nested-test-pkg/src/index.js'

へ飛ばされているのである。

今、import文に`import XXX from './helpers/utils`というパスがあったとしたら

本来'http://unpkg.com/nested-test-pkg/src/helpers/utils'で要求しなくてはならないということである。

今までリダイレクトが問題にならなかった理由：TODO: 要まとめ


解決策：リダイレクトURLをresolveDirへ渡す

axios.get()で返されるオブジェクトの中にはリダイレクトされたときのURLが載っている。

`request.responseURL`これがリダイレクトされたときのURL。

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

#### 検証：実際のnpmパッケージをimportさせてみる

次のテストコードで実際のNPMパッケージをインポートできるか試す。

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

アプリケーションが最終的に生成した次のURLにアクセスしようとしてみると404エラーが起こる

`https://unpkg.com/react-dom@18.2.0/react-dom`

問題：

`react-dom@18.2.0/client.js`のimport文を解決しようとして

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

## キャッシュ機能の追加

どうしてキャッシュ機能を設けるの？何とトレードオフなのか？

どうやってキャッシュ機能を設計するの？スタンダードとかあるの？

#### 情報収集

- MDN Cache

https://developer.mozilla.org/en-US/docs/Web/API/Cache

> `Cache` interfaceはリクエスト・レスポンス・ペアが長きにわたってメモリに保持され続けるための持続的なストレージメカニズムである
> どのくらい保持してくれるかはブラウザによる。



#### 設計

手探りである。

- いつキャッシュを取得する
- キャッシュのデータ設計とは？
- どこに保存するの？

保存先として講義だとlocalforageというパッケージを使っている。

キャッシュの機能といえば、
- リクエスト済かどうかすぐわかること
- 検索機能がめちゃ早いこと
- キャッシュの保持期限を設けて期限が過ぎたら削除すること

TODO:まずは自力でキャッシュ機能を実装してみる。
その後パフォーマンスの改善、講義との比較を行う。

まずはreact-dom/clientをimportしたときの解決のされ方からどう改善できるのか見出してみる。

onResolve()で解決されたpathと、そのpathでfetch()したdataをペアとすればいいのかな

new URL("./", request.responseURL).pathname

```bash
# index.jsで`react-dom/client`
onResolve: {path: 'react-dom/client'}
onLoad: 
  fetch redirect to "https://unpkg.com/react-dom@18.2.0/client.js"
  return resolveDir: "/react-dom@18.2.0/"

```

#### [自習] JavaScript 配列から要素を見つける最も早い方法

実現したいこと:

配列の中のオブジェクトが探しているプロパティを持つ場合、そのオブジェクトのコピーを返してほしい

参考：

https://stackoverflow.com/a/35398031

```TypeScript
interface iCachedModule {
    // path of resources which is part of url.
    path: string;
    // Fetched content data.
    content: string;
};

const cachedModules: iCachedModule[] = [];
cachedModules.push({
    path: "/react-dom@18.2.0",
    content: "..."
});

// To find, compare path property.
// pathを比較して、一致するpathだったらそのオブジェクトのcontentを返す
// 
// 
const getCachedModuleContent = (path: string): string | undefined => {
    const module: iCachedModule | undefined = cachedModules.find( m => m.path === path);
    if(module === undefined) return undefined;
    return moudule.content;
};


```

とはいえ講義ではlocalforageというパッケージを使って、その捜索を丸投げしている。

つまりキャッシュ済かどうかのチェックをパッケージに任せているので、アプリケーションにそのチェックコードを書かなくていい

TODO:

localstorageの普通の使い方
npmパッケージを使うべきなのか
