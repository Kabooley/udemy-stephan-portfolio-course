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

#### `esbuild.build()`

今`esbuild.transform()`を動かすことができたので、

`esbuild.build()`も挙動を確認する。

すると発生するエラー：

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

エラーの内容と発生する原因：

- 内容：ファイルシステムがないから探せない

- 原因：モジュールの捜索は通常Filesystem上で行われるが、ここはブラウザ上である
- 原因：ユーザが入力したimportで取り込もうとしているモジュールは、node_modules/等があるわけではないのでそもそもローカルに存在しない

次の課題：

- モジュールの捜索にプラグインを導入してモジュールの捜索へ介入する
- モジュールの捜索をfilesystemからではなくネットワーク上から取得するようにする


#### プラグインの導入

#### [自習] esbuild プラグイン

https://esbuild.github.io/plugins/

> plugins APIはビルドプロセスの各所へコードを追加することができる。
> `build` APIにのみ適用できて、`transform`には適用できない。

esbuildプラグインは`name`と`setup`の2つのプロパティからなるオブジェクトである。

詳しくは公式見た方がヒントを得やすい。

#### 相対パスの解決

`esbuild.onResolve()`は正規表現で指定したフィルターに一致するパスを見つけたときに、

どのようにそのパスを解決するのかを指定する。

```JavaScript
// esbuild.onResolve()

// 抽象的に表現するとこうなる
build.onResolve(
  {filter: string /* コールバックを実行させたいpathを正規表現で指定する */},
  (args: any/* 解析中のモジュールに記述されているモジュールパスなど */) => {

    // argsをつかって名前解決する手段をカスタマイズ

    // 戻り値でfilterでヒットしたpathに対してはこのようにpathを解決せよという
    // 解決方法をかえす
    return {
      path: string/* filterでヒットしたpathはここにあるというpathを記述する*/,
      namespace: string /* 任意でそのpathはこのnamespaceに含めると指定させる */
    }
  }
);
```


> `onLoad`についているコールバック関数は「external」として認識されていないpath/namespaceの一意のすべてのペアに対して実行される。

その役割はモジュールの中身を返すこととどうやってそれらを得るかの機能を提供することである。

基本的にfilterで指定しない限りは全てのパスに対してonLoadが実行されることになると思う。

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

## TEST CODE

```JavaScript
import * as tinyTestPackage from 'tiny-test-pkg';

const app = () => {
  console.log(tinyTestPackage);
};
```

## import/require文のないモジュールを取得する

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

#### import/require文を含むモジュールの取得

unpkg経由で取得するパッケージのファイがimport/require文を含んでいたら。


```JavaScript
import * as mediumTestPackage from 'medium-test-pkg';

const app = () => {
  console.log(mediumTestPackage);
};
```


今のままで実行すると...

- `medium-test-pkg/index.js`の解決
- `medium-test-pkg/index.js`のロード
- `medium-test-pkg/index.js`内の`const toUpperCase = require('./utils')`の発見
- `'./utils'`が解決できないのエラー

エラーが起こる原因：

onLoad()が次のパスで取得しようとしているため。`https://unpkg.com/./utils`

ならば次のようにできればいいのだよね？

`https://unpkg.com/./utils` --> `https://unpkg.com/medium-test-pkg/utils`

つまり、

- `http://unpkg.com/` + `${package-name}/${sub-directory}`という形式
- `./`または`../`を見つけたときにという条件

現状の流れ：

```bash
# onResolve index.js
# onLoad index.js
# onResolve `import * as mediumTestPackage` from 'medium-test-pkg'
args.path: medium-test-package
args:
{
  importer: "index.js"
  kind: "import-statement"
  namespace: "a"
  path: "medium-test-pkg"
  pluginData: undefined
  resolveDir: ""
}
returned path: https://unpkg.com/medium-test-pkg
# onLoad medium-test-pkg
args: 
{
  namespace: "a"
  path: "https://unpkg.com/medium-test-pkg"
  pluginData: undefined
  suffix: ""
}

# onResolve `const toUpperCase = require('./utils')`
args: 
{
  importer: "https://unpkg.com/medium-test-pkg"
  kind: "require-call"
  namespace: "a"
  path: "./utils"
  pluginData: undefined
  resolveDir: ""
}
# onLoad index.js
# onResolve index.js
# onLoad index.js

```

#### [自習] `esbuild.OnLoadResult.resolveDir`

https://esbuild.github.io/plugins/#on-load-results

> このモジュールのインポートパスをファイルシステム上の実際のパスに解決するときに使用するファイルシステムディレクトリです。file名前空間内のモジュールの場合、この値のデフォルトはモジュールパスのディレクトリ部分である。それ以外の場合は、プラグインが提供しない限り、この値のデフォルトは空です。
> プラグインが提供しない場合、esbuild のデフォルトの動作では、このモジュールの import を解決しません。このディレクトリは、このモジュールの未解決のインポートパスに対して実行される on-resolve コールバックにも渡されます。

つまり、

プラグインが`resolveDir`でディレクトリを指定すると、そのモジュールでの未解決import文を見つけるたびに、esbuildはonReolsve()のargsの`resolveDir`プロパティにそのディレクトリを値として与える。

ファイルシステムがある環境で実行すれば、通常`resolveDir`にはモジュールパスのディレクトリを値として受け取る

ファイルシステムが存在しない環境であれば、`resolveDir`の値は空であり、プラグインが提供することができる。

#### 相対パスの解決

`resolveDir`を使ってパスの解決を図る。

`esbuild.onLoad()`でパッケージのインポートをしたら、`resolveDir`にそのパッケージ名を与えることで、

そのモジュール内での`esbuild.onResolve()`の引数で`resolveDir`を受け取り、

パッケージ名/path名で解決できるようになる
