# Note: Transpiling and Bundling in Browser

主に講義のセクション8の内容。

## Module System

#### What are the differences between Babel and Webpack?

https://stackoverflow.com/a/47006938

Babel: モダンなJvavaScript文法を、どのブラウザでも実行できるES5以前のコードに変換してくれる「トランスパイラ」である。

Bundler: 依存関係の解析とモジュールバンドリングを行う「ビルドシステムである」。webpackはBundlerの中でもっとも普及している物の一つである。一般的な概念は、Webpack が複雑な依存関係を持つモジュールをバンドルにパッケージ化することです。
要は複雑な依存関係を解決したコードを一つのファイルにまとめる技術である。

## Webpack basics

```bash
$ yarn add webpack@xxxx webpack-cli@xxxx --exact
$ mkdir src
$ touch mkdir/index.js mkdir/message.js
# Modify these two files and they have dependencies each other.
$ webpack --mode=development
# dist/ディレクトリが生成されて、src/以下のファイルがバンドリングされた一つのファイルがそこに出力される
```

Bundlerのしていること：

- エントリーファイル（index.js）を解析
- 自動的に`require``import``export`などのモジュール文法を見つけ出す
- 自動的にモジュールをドライブから探し出す
- これら見つけ出したモジュールの内容である値をすべてひとつのファイルに出力して正しく動作するようにまとめる。

ということで、

bundlerを使えば自動でモジュールを探して取り込むことをしてくれる。

これはBig Three Challangeの一つを解決してくれるはず。

## Webpackのモジュールの捜索場所を指定する

バンドらがネットワーク上からモジュールをとってくるようにする。

これから作成しようとするサービスは、ユーザが使えば使うほど依存関係をローカルに保存していくわけにはいかない。

なぜなら依存関係が無限大に増えていくからである。

なので必要になった時にだけネットから拾ってきて

「何らかの方法で」拾ってきたモジュールを取り込む。

ただしローカルに保存しない。

そんな方法を模索する。

3つのアプローチ：

otion1

クライアントのReactアプリケーションがバックエンドのサーバへ、

ユーザが入力したコードを送信して、

サーバがコードを解釈、その際バンドリングも行ってもらい、

必要な依存関係を`NpmInstallWebpackPlugin`というプラグインをインストールしたwebpackによって、ネットワークからインストールする。

そうしてバンドリングされたコードをクライアントへ帰す。

このオプションの問題点は、結局依存関係の保存先がローカルからサーバに移っただけである点である。

options2

クライアントからコードがサーバへ送信されて、バンドリングされたコードが返される点は同じ。

依存関係をインストールする代わりに、ソースコードだけを取得するようにする。

（何が違うんだ？）

これでサーバに保存する必要がなくなるとのこと。

？

options3

ク山田里奈ライアントですべてoptions2のことを実行する。

つまりサーバ要らずで行う。

## Remote vs. Local

先のバンドリングの解決ための方策3つは結局リモートで行うか、ローカルで行うかの決断を迫ることになる。

TODO: 別のファイルに取ったノートをここに張り付けること

## project set up

```bash
$ npx create-react-app jbook --template typescript
$ cd jbook
$ yarn add esbuild-was@0.8.27 --exact
# create src/index.js and return App jsx
$ npm start
# make sure the app is running correctly
```

## Understand ESBuild

その舞台裏。

`esbuild-wasm` npm moduleは、

webアセンブリを搭載しているesbuildのモジュールで、

このwebアセンブリのおかげでブラウザ上でバンドリングを可能にしている。

つまり、

実際にはJavaScriptコードの解釈を裏側にあるC++やgo等のコードが解釈して

解釈した内容をJavaScriptコードに直してバンドリングしているのである。

webアセンブリは高速でブラウザ上で動かすことができる。

#### ESBuildの初期化

ベーシックな使い方:

```JavaScript
import * as esbuild from 'esbuild-wasm';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
    const ref = useRef<any>();
    const [input, setInput] = useState('');
    const [code, setCode] = useState('');

    // NOTE: esbuild-wasmの機能を提供開始させる
    const startService = async () => {
        ref.current = await esbuild.startService({
            worker:true,
            wasmURL: '/esbuild.wasm'
        });
    };

    useEffect(() => {
        startService();
    }, []);


    // NOTE: トランスパイル機能の追加
    const onClick = async () => {
        if(!ref.current) {
            return;
        }
        const result = await ref.current.transform(input, {
            loader: 'jsx',
            target: 'es2015',
        });

        setCode(result.code);
    };

    return (
        <div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}>
            </textarea>
                <div>
                    <button onClick={onClick}>Submit</button>
                </div>
                <pre>{code}</pre>
        </div>
    );
};

ReactDOM.render(<App />, document.querySelector('#root'));
```

トランスパイルは実装できた。

#### ビルド機能の追加

結論：

`unpkg.com`を導入する。

ビルド機能追加に於ける問題点まとめ：

- ブラウザにはファイルシステムがないよ
    NPMレジストリからモジュール（のpath）を取得するようにする

- NPMレジストリに直接アクセスする方法はないよ
    プロキシを経由してくれるパッケージを導入して回避させる

---

モジュールを捜索するシステムは、ファイルシステム上で行われる。

しかしブラウザにはファイルシステムはない!!

先のどういう実装にするかの議論で、ローカルでトランスパイルとバンドリングを行うとしたけれど、

モジュールの導入はネットワーク上のNPMレジストリから取得する。

なので...

- ユーザが入力した`import react from 'react'`をESBuildが発見する

- ESBuildはreactがどこにあるのか探し始める

- 開発者がその捜索に介入してNPMレジストリから取得するようにさせる

- NPMレジストリからPATHを取得してくる

- PATHをESBbuildへ渡す

を実現したい。

NOTE: `PATH`とは、通常`npm install`するときに内部的に用いられるURLである。


`node_modules/react/index.js`の内容：

```TypeScript
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
```

これが内部的に行われている

NPMレジストリにはブラウザから直接アクセスすることはできないようになっている。

なので上記のURLを単純にfetchするような実装をするとエラーになる。

NPMレジストリが拒否するからである。

これの解決のために間にプロキシを挟んでくれるnpmパッケージを導入してそれによってダウンロード可能にさせる。

#### build機能の実装

こうなる。


```JavaScript
import * as esbuild from 'esbuild-wasm';
 
export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResole', args);
        return { path: args.path, namespace: 'a' };
      });
 
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              import message from './message';
              console.log(message);
            `,
          };
        } else {
          return {
            loader: 'jsx',
            contents: 'export default "hi there!"',
          };
        }
      });
    },
  };
};
```

```TypeScript
// index.js 

import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
// ...
    const onClick = async () => {
        if(!ref.current) {
            return;
        }

/*
esbuildにビルドさせる呼出。

プラグインに'./plugins/unpkg-path-plugin'を使わせることで、

unpkgによる解決を実現させている

*/ 
        const result = await ref.current.build({
            entryPoints: ['index.js'],
            // バンドル処理をしてねという指示
            bundle: true,
            write: false,
            plugins: [unpkgPathPlugin()]
        });

        setCode(result.c ode);
        // result.code:
        // {
        //   outputFiles: [
        //     {
        //       contents: Uint8Array[],
        //       path: string,
        //       text: これがバンドルされたコード
        //     }
        //   ]
        // }
        setCode(result.code.outputFiles[0].text)
    };
```

#### DeepDiveInBundling


以下の話は一般的なバンドリングパッケージに通用する話なので聞いて損はないよとのこと

```TypeScript
// plugins/unpkg-path-plugins.ts

import * as esbuild from 'esbuild-wasm';
 
export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // 
      // onResolve
      // 
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResole', args);
        return { path: args.path, namespace: 'a' };
      });
 
      // 
      // onLoad
      // 
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        // 実際には以下のようにハードコーディングされない部分
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              import message from './message';
              console.log(message);
            `,
          };
        } else {
          return {
            loader: 'jsx',
            contents: 'export default "hi there!"',
          };
        }
      });
    },
  };
};
```

`unpkgPathPlugin`はオブジェクトを返す。

ここで2つのプロセスを定義する：onResolveとonLoadを使うこと。

ESBuildのバンドリングプロセス：

index.jsをバンドルしてくれと指示された...

- onResolve step: index.jsがどこにあるのか探し出す
- onLoad step: index.jsファイルのローディングを試みる
- index.jsを解析してimport/export/requireを見つけ出す
- onResolve step: import/export/requireがリクエストするモジュールを探し出す
- onLoad step: モジュールファイルのローディングを試みる

というプロセス

つまり、

onResoveはモジュールを探す処理をリスンして、モジュールのpathの解決に関してカスタム可能とし、

onLoadはモジュールをローディングする処理をリスンし、同様にカスタムするのである。

そうしてリスンして処理を追加することで、ESbuildのバンドリングプロセスをオーバーライドすることができるようになるのである

具体的に:

```TypeScript
      build.onResolve(
        // filterでリスンしたいpathを絞る。正規表現で指定する
        { filter: /.*/ },
        // argsには
        async (args: any) => {
        console.log('onResole', args);
        return { path: args.path, namespace: 'a' };
      });

```

## 自習：ESBuild Plugins

参考：

https://esbuild.github.io/plugins/

コンセプト

Namespaces:

ESBuldはファイルシステム上の名前空間を取り扱う。

FIlters:

全てのコールバックは`filter`として正規表現を提供する必要がある。パフォーマンス上重要なことである。モジュールを見つけ出す処理は負荷が高いから必ずフィルタをつけろと念押し。

#### On-resolve callbacks

`build.onResolve({filter: /.*/}, args => {...})`のコールバックのこと。

onResolveコールバック関数は、すべてのESbuildがビルドしようとしているimportパスにおいて実行される。

コールバックはESBuildがどのようにpathを解決するのかカスタマイズ可能である。

こんpathだったら次のコールバックを実行しますというようにできる

つまり、

```JavaScript
  // ESBuildのプラグイン呼出
  const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin()]
  });
```

entryPoinstsで`index.js`が指定されているので

ここを起点にして、

まず`index.js`を解析してimport/require/exportを探して


たとえば`import react from './components/post'`を見つけたら

`post`のモジュールがないか探す旅に出かけて、

さらに`post`の中を解析して...と続けていく

onResolveはそのすべてに対してコールバックを実行させると大変な負担であると公式が言っているのでフィルターを設けてコールバックを実行すべきpathを制限しているのである。

#### on resolve options

filter: コールバックを実行させるべきpathを正規表現で指定する。

namespace: onResolveのコールバック関数は与えられたnamespaceのなかのモジュールにしたいしてのみ実行できる


#### on resolve arguments

コールバック関数に与えられる引数群：

```TypeScript
interface OnResolveArgs {
  path: string;       // （解析中の）モジュールのソースコードに記述されているモジュールパス。
  importer: string;   // 
  namespace: string;
  resolveDir: string;
  kind: ResolveKind;
  pluginData: any;
}

type ResolveKind =
  | 'entry-point'
  | 'import-statement'
  | 'require-call'
  | 'dynamic-import'
  | 'require-resolve'
  | 'import-rule'
  | 'url-token'
```

#### on resolve results

onResolveのコールバック関数が返すことができるオブジェクト：

```TypeScript
interface OnResolveResult {
  errors?: Message[];
  external?: boolean;
  namespace?: string;
  path?: string;
  pluginData?: any;
  pluginName?: string;
  sideEffects?: boolean;
  suffix?: string;
  warnings?: Message[];
  watchDirs?: string[];
  watchFiles?: string[];
}

interface Message {
  text: string;
  location: Location | null;
  detail: any; // The original error from a JavaScript plugin, if applicable
}

interface Location {
  file: string;
  namespace: string;
  line: number; // 1-based
  column: number; // 0-based, in bytes
  length: number; // in bytes
  lineText: string;
}

```

`path`: 解決されたpath。onResolveが解決中のimport/requireパスはこいつであるという回答となるpathを指定する。

`namespace`: 解決されたpathと結びつくnamespaceのこと。デフォルトは`file`とされる。

#### 使い方

*具体的な例で*

いま講義では、モジュールはネットワーク経由で、

`unpkg`を使って取得することにしている。

なので、

ファイルシステムから探すわけではないpathに出くわしたら、

unpkgにfetchするようにすればいいわけである。

```TypeScript
// ...
// 名前解決する過程でローカルファイルをimport/requireする宣言を見つけたら反応
build.onResolve({filter: /.*/}, (args: any) => {
  // なにかしら`index.js`をimport/requireする宣言を見つけたら...
  if(args.path === 'index.js') {
    // それは次のように解決してくださいという命令
    // 
    // 具体的にはファイルシステムを参照するようにしている
    return { path: arggs.path, namespace: 'a' };
  }
  else {
    // index.js以外はこちらということになる
    return {
      // 具体的にはとあるパッケージをネットワーク越しに取得してねということになる
      path: `https://unpkg.com/${args.path}`,
      namespace: 'a'
    };
  }
});

// 抽象的に表現するとこうなる
build.onResolve(
  {filter: string /* コールバックを実行させたいpathをしていする */},
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

## 自習：onLoad Callbacks

https://esbuild.github.io/plugins/#on-load

> `onLoad`についているコールバック関数は「external」として認識されていないpath/namespaceの一意のすべてのペアに対して実行される。

その役割はモジュールの中身を返すこととどうやってそれらを得るかの機能を提供することである。

多分ですが、

`onResolve`で解決されたすべてに対して反応するのがこの`onLoad`だと思う。

つまり`onLoad`はパスが解決されたら発火するのである。

そしてその解決内容をon-load argumentsとして取得する。

コールバックで処理内容をカスタマイズして、

最終的にそのモジュールの中身を返す

というのが具体的な役割であるようだ。

#### on-load options

onResolve同様、filterとnamespaceである。

書いてあることはonResolveの方と同じ。

#### on-load arguments

onLoadのコールバック関数の引数の話。

path: 解決されたモジュールのパス。もしもnamespaceが`file`ならばファイルシステムを指していると認識される。それ以外ならそれ以外と認識される。

namespace: onResolveにてそのモジュールパスに与えられたnamespaceのこと。

#### on-load results

名前解決したモジュールの内容を返す。

#### 具体的に

```TypeScript
// (たとえばonResolveで)解決されたpath全てに対して反応する。
build.onLoad(
  {filter: string, /* どんなpathに反応するのか指定する */}
  (args: any /* そのモジュールの解決されたpathや付与されたnamespace等の情報 */) => {
    // 処理をカスタマイズして...

    return {
      // そのモジュールの中身を返す
    }
  }
);
```

## Issues with Multi-File Packages

取得しようとしているモジュールが、そのモジュールの依存関係としてそのモジュールが相対パスで他のモジュールをimportしている

といった場合はどうすればいいのか？

```JavaScript
// index.js
import mediumTestPackage from 'medium-test-package';

// mediumTestPackage.js

// こっちはネットワークから取得するとして
import axios from 'axios';
// そのモジュールのファイルシステムとしての依存関係はどのように解決すべきか
import utils from './utils';
```

#### 相対パスの解決

なぜ相対パスだと問題なのか？

`http://unpkg.com/medium-test-pkg/utils`が正しい解決パスであるのだが、

`http://unpkg.com/medium-test-pkg/./utils`と解釈してしまうからである。

流れ:

onResolve: `path: 'http://unpkg.com/medium-test-pkg', namespace: 'a'`を返す

onLoad: onResolveの戻り値に従って'http://unpkg.com/medium-test-pkg'のコンテンツを返す。

onResolve: そのコンテンツの中を解析して次のように解決する。

  `path: 'http://unpkg.com/./utils', namespace: 'a'`

それは次の部分に因るからである

```TypeScript
build.onResolve({ filter: /.*/ }, async (args: any) => {
    console.log('onResolve', args);
    if (args.path === 'index.js') {
        return { path: args.path, namespace: 'a' };
    }
    return {
        namesapce: 'a',
        // NOTE: args.pathをそのままわたしているから
        path: `https://unpkg.com/${args.path}`,
    };
});
```
と、つまり丸っと`./`含めてわたしているからである。

なので、相対パスかどうかチェックする条件分岐を追加すればよい

```JavaScript
build.onResolve({ filter: /.*/ }, async (args: any) => {
    console.log('onResolve', args);
    if (args.path === 'index.js') {
        return { path: args.path, namespace: 'a' };
    }
    if(args.path.includes('./') || args.path.includes('../')) {
      return {
        namesapce: 'a',
        path: new URL(args.path, args.importer + '/').href
      };
    }
});
```

## Nested require

お次はネストされたモジュールを取得する方法の解決である。

```
http://unpkg.com/nested-test-pkg
      └──────────src/
                  ├────── index.js
                  └────── helpers/
                            └──────utils.js
```

現状、ネストされたモジュールは解決できない。

理由はリダイレクトに対応できていないからである。

どういうことかというと、

onResolve: `path: 'http://unpkg.com/nested-test-pkg', namespace: 'a'`

onLoad: `path: 'http://unpkg.com/nested-test-pkg', namespace: 'a'`からコンテンツを取得する

実はここでリダイレクトが起きている。

それは

'http://unpkg.com/nested-test-pkg'の要求は

実際には'http://unpkg.com/nested-test-pkg/src/index.js'を指すということである。

これはネットワーク上で行われるリダイレクトによって解決されるのだが、

これが`helpers/utils`のリクエストとなると次のように解釈されることになる

`path: 'helpers/utils', importer: 'http://unpkg.com/nested-test-pkg/'`

このimporterだと結果src/~のURLにリダイレクトされないで

'http://unpkg.com/nested-test-pkg/helpers/utils'からonloadしようとしてしまう

なのでうまくいかないのである。

帰ってきたもの： `path: 'http://unpkg.com/nested-test-pkg/helpers/utils'`
欲しいもの： `path: 'http://unpkg.com/nested-test-pkg/src/helpers/utils'`

#### ネストされたパスの解決の方策

リダイレクトが発生する状況に対応するため、

- 取得しようとするモジュールのパッケージのメインファイルの取得に関しては:

  `http://unpkg.com/` + `package name`で解決できる。

  メインファイルだけはリダイレクトしてくれるから。

  'http://unpkg.com/nested-test-pkg/'

  リダイレクトで、

  'http://unpkg.com/nested-test-pkg/src/index.js'

- 取得しようとするモジュールのパッケージのメインファイル以外ファイルの取得に関しては:

  `http://unpkg.com/`
  +
  最後のファイルが見つかったディレクトリ
  +
  このファイルを要求する記述

  'http://unpkg.com/nested-test-pkg/src/helpers/utils'

#### `resolveDir`

https://esbuild.github.io/plugins/#on-load-results

resolveDir:

> このモジュールのインポートパスをファイルシステム上の実際のパスに解決するときに使用するファイルシステムのディレクトリです。

> ファイル名前空間内のモジュールの場合、この値のデフォルトはモジュールパスのディレクトリ部分です。それ以外の場合は、プラグインが提供しない限り、この値はデフォルトで空です。プラグインが提供しない場合、esbuild のデフォルトの動作は、このモジュールの import を解決しません。このディレクトリは、このモジュールの未解決のインポートパスの上で実行されるすべての on-resolve コールバックに渡されます。

```TypeScript
import * as esbuild from 'esbuild-wasm';
import axios from 'axios';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        // 相対パスが含まれるパスの時は(ネストされたパスも対応)
        if (args.path.includes('./') || args.path.includes('../')) {
          return {
            namespace: 'a',
            path: new URL(
              args.path,
              'https://unpkg.com' + args.resolveDir + '/'
            ).href,
          };
        }

        // 相対パスでないパスの時は(パッケージ名の時は)
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        };
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('nested-test-pkg');
              console.log(message);
            `,
          };
        }

        const { data, request } = await axios.get(args.path);
        return {
          loader: 'jsx',
          contents: data,
          // 
          // point
          // 
          resolveDir: new URL('./', request.responseURL).pathname,
        };
      });
    },
  };
};
```

onLoad: `request.responseURL`にはリダイレクトされる URL が入っている(`https://unpkg.com/nested-test-pkg@1.0.0/src/index.js`)

onLoad で`new URL('./', request.responseURL).pathname`つまり`"https://unpkg.com/nested-test-pkg@1.0.0/src/"`を resolveDir として登録するので

それ以降の onResolve で`resolveDir: 'https://unpkg.com/nested-test-pkg@1.0.0/src/'`として取得できるようになる

request.responseURL には常に本来の URL が返されるので

resolveDir としてその URL を登録して

onResolve のコールバックで参照できるようにすれば

リダイレクトが発生する場合にもしない場合にも対応できる。

