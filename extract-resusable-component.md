# Note: Section 12

## コンポーネント分割

初めの方割愛。中盤のリファクタリングも割愛。

#### bundlerの分離

bundlingプロセスが行っていることは...

- ローコードの取得
- ローコードの変換（バンドリング）
- 変換コードの返還

```TypeScript
import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from '../plugins/unpkg-path-plugin';
import { fetchPlugin } from '../plugins/fetch-plugin';

let service: esbuild.Service;

// 引数でローコードを取得する
export default async (rawCode: string) => {
    // esbuildのインスタンスの起動
    if(!service) {
        service = await esbuild.startService({
          worker: true,
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
        });
    }
    
    // 変換
    const result = await service.build({
        entryPoints: ['index.js'],
        bundle: true,
        write: false,
        plugins: [unpkgPathPlugin(), fetchPlugin(rawCode)],
        define: {
          'process.env.NODE_ENV': '"production"',
          global: 'window',
        },
    });

    // 返還
    return result.outputFiles[0].text;
};
```

#### 複数のエディタとプレビューウィンドウ

今後複数コンポーネントを表示させるようにしなくてはならないので、

簡単に出力できるようにコンポーネントをラッピングする。

今のところ`<App/>`の内容が丸っと一つのエディタとプレビューの塊なのでこれをラピングする。

