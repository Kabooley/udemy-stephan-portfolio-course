# Note: Caching for big performance gains

## Crazy number of requests

多分、reactとかを`import react from 'react'`すると
node_modules並みの依存関係をダウンロードすることになる。

作成中のアプリケーションでいえば、必要な分だけfetch()リクエストを送信することになる。

このセクションでは余計なリクエストを送信しないようにキャッシング機能を設けてパフォーマンスを向上するようにアプリケーションを改善していく。

#### Implementing Caching layer

要は`onLoad()`でキャッシング機能を設ける

`nested-test-pkg`はロード済か？

ロード済である: onLoadは速やかにreturnする

ロード済でない：fetch()する

キャッシュしたデータはどこに保存しておけばいいのだろうか。

ブラウザのlocalStroageにはそんなに空きがない。

`indexedDB`なるものを使う。

#### IndexedDB API

https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API

> IndexedDB は、ファイルや blob を含む大量の構造化データをクライアント側で保存するための低レベル API です。この API はインデックスを使用して、高パフォーマンスなデータの検索を行うことができます。ウェブストレージは比較的少量のデータを保存するのに有用ではありますが、構造化された非常に多くのデータを扱うには不十分です。IndexedDB が解決策を提供します。

ということでブラウザにすでに組み込まれているストレージの一種であるようだ。

#### Caching with key-value paires

```bash
$ cd jbook
$ npm install localforage
```

基本的な使い方

```TypeScript
import localforage from 'localforage';

// NOTE: localforageの基本的な使い方
const fileCache = localforage.createInstance({
  name: 'filecache' 
});

(async () => {
  // key-valueのセットで保存する
  await fileCache.setItem('color', 'red');

  // keyで呼出
  const color = await fileCache.getItem('color');

  console.log(color);
})();
```

これをonLoad()へ実装していく。

キャッシング機能は、モジュールのローディングの段階にすでにキャッシング済なのか検査すればよいので

```TypeScript
build.onLoad({ filter: /.*/ }, async (args: any): Promise<esbuild.OnLoadResult> => {
    console.log('onLoad', args);

    if (args.path === 'index.js') {
        return {
        loader: 'jsx',
        contents: `
            const message = require('nested-test-pkg');
            console.log(message);
        `,
        };
    };
    // NOTE: キャッシング検査
    // 
    // そのモジュールは既にキャッシングされているか？
    const cacheResult = await fileCache.getItem(args.path);

    // kキャッシング済ならそれを返す。
    if(cachedResult) {
        return cachedResult;
    };

    // キャッシング済でないならfetch()する
    const { data, request } = await axios.get(args.path);
    const result: esbuild.OnLoadResult = {
        loader: 'jsx',
        contents: data,
        resolveDir: new URL('./', request.responseURL).pathname,
    };

    // でキャッシングしておく
    await fileCache.setItem(args.path, result);

    return result;
});
```

これでキャッシング機能によってインポート済のモジュールに対して改めてリクエストを送る必要がなくなった。

#### Refacotring

肥大化する前に`unpkg-path-plugins.ts`を分割しよう。

onResolveとonLoadで分割して、index.jsで両方呼び出すようにした。

```TypeScript
// 
// --- BEFORE -------------------------------
// 
import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name: 'filecache' 
});

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        if (args.path.includes('./') || args.path.includes('../')) {
          return {
            namespace: 'a',
            path: new URL(
              args.path,
              'https://unpkg.com' + args.resolveDir + '/'
            ).href,
          };
        }

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
          resolveDir: new URL('./', request.responseURL).pathname,
        };
      });
    },
  };
};


// 
// ---- NOTE: AFTER --------
// 

/**
 * onResolveだけでまとめている。
 * onLoadの処理は、fetch-plugin.tsへ分離した。
 * 
 * */ 
import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // Handle root entry file of 'index.js'
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        return { path: 'index.js', namespace: 'a' };
      });

      // Handle relative paths in a module
      build.onResolve({ filter: /^\.+\// }, (args: any) => {
        return {
          namespace: 'a',
          path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/')
            .href,
        };
      });

      // Handle main file of a module
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        };
      });
    },
  };
};
```
```TypeScript
import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
  name: 'filecache',
});

/**
 * onLoad()の処理だけ定義してある。
 * 
 * */ 
export const fetchPlugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        }

        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        if (cachedResult) {
          return cachedResult;
        }
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};

```
```TypeScript
import * as esbuild from 'esbuild-wasm';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: '/esbuild.wasm',
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
    //   
    // NOTE: ここでリファクタリングした2つのプラグインを呼出している
    // 
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    // console.log(result);

    setCode(result.outputFiles[0].text);
  };

  return (
    // ...
  );
};
// ...
```

上記のように、

onResolveの処理とonLoadの処理を分離しても、

pluginsの配列に二つを含めておけばesbuildにそのように伝わる模様。

