# monaco-editorとReactの統合

## 詳しい検証は別repoに

`playground/webpack`が検証用リポジトリになっている。

`playground/webpack/react-alize-monacoeditor.md`に検証内容の記録。

## わかったことまとめ


だいたい@monaco-editor/reactでできるということ。

- monacoReact.BeforeMountは内部でmoanco.editor.create()する前に呼び出される関数
- monacoReact.OnMountは内部でmoanco.editor.create()された後にuseEffect()が呼び出されてその時に実行される関数
- monacoReact.OnChangeはmodelの内部が反攻されたときに呼び出される関数。値の変更含む。
- monacoReact.OnValidateは内部でmodelのmarkerの変更があった時にイベントリスナが呼び出されて、そのリスナのコールバック内部から呼び出され、OnValidateが受け取るのは変更された結果のmarkerである

- monacoインスタンスまたはeditorインスタンスはBeforeMountかOnMountで取得できて、代替こいつらをいじればmonaco-editorをカスタマイズできる

- 自前でmonaco-editorをReactコンポーネント化するのはかなりhackyなので、@monaco-editor/reactで出来る範囲ならそれを使った方がよい。

## 実装

#### Prettier formatting

講義ではformattingは、専用のボタンを用意してmonaco-editorの既存機能を使わずに実装していたけれど、

既存機能を使ってformatするようにする。

```TypeScript
/**
 * Set formatting rules.
 * 
 * */ 
const setFormatter = (m: typeof monacoAPI): void => {

    // DEBUG:
    console.log("[App] setFormatter");

    m.languages.registerDocumentFormattingEditProvider(
		"javascript",　
		{
			async provideDocumentFormattingEdits(
                model, options, token) {
                // 取得した値をformatして
				const formatted = await prettier.format(
					model.getValue(), 
					{
						parser: 'babel',
						plugins: [parser],
						useTabs: false,
						semi: true,
						singleQuote: true,
                        tabWidth: 2
					})
					.replace(/\n$/, '');

                // 適用範囲とformatされた値を返せばいいだけ
				return [{
					range: model.getFullModelRange(),
					text: formatted,
				}];
			}
	});
};

// ...

	/***
	 * Before create MonacoEditor editor instance. 
	 * 
	 * */ 
	const beforeMount: monacoReact.BeforeMount = (m) => {
		console.log("[monaco] before mount");
		_monacoRef.current = m;
        // 一度登録すればいいだけ
		setFormatter(m);
	};

```

#### bundling in worker

bundlingプロセスをworkerへ移す。

bundling logicをworkerへ移すにあたって...

- workerファイルがimportするモジュールもworkerでなくてはならないのか？

bundling logic振り返り：

- `bundler(code)`を呼び出すだけ。

やること:

- webpack.config.jsのentryにbundle.worker.tsを追加する
- codeをonSubmitするコンポーネントでworkerを生成する。
- worker生成時、`type: moduele`を指定する(ES6 import文が必要なので)。

#### workerとやりとりするdataの型

messageイベントのイベントの型：

https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.messageevent.html

`MessageEvent`

Genericsを使って`MessageEvent.data`の型を指定する

```TypeScript
type iOrderToWorker = "bundle" | "jsxhighlight" | "eslint";

// bundleWorker.ts
export interface iMessageBundleWorker {
    code: string;       // 呼び出し側から受け取るコード
    bundledCode: string;// bundlingしたコード
    err: Error | null;         // worker内で発生したエラー
	order: iOrderToWorker;		// what order 
};


// index.tsx
bundleWorker.addEventListener('message', (
	{ data }: MessageEvent<iMessageBundleWorker>
) => {
	const { bundledCode, err } = data;
	if(err) throw err;
	if(previewRef.current && previewRef.current.contentWindow) {
		previewRef.current.contentWindow.postMessage({
			code: bundledCode
		}, '*');
	}
}, false);
```

#### 検証

- 関係ないmessageeventにも反応してしまう
- bundling processは出来ているけどメインスレッドへ戻せていない模様

#### worker.postMessage()受信メッセージの検査

- check origin is valid
- check the message is worker must treat

`worker.postMessage()`で送信されたメッセージは、すべての`self.onmessage()`で受信する模様。

そのためそのworkerで必要なメッセージなのかどうか検査する必要がある。


```TypeScript
// index.tsx

const ContentSection = (): JSX.Element => {
    // set iIsEditor
    const [isEditor, setIsEditor] = useState<iIsEditor>("editor");
    const [code, setCode] = useState<string>("");
    const editorRef = useRef<monacoAPI.editor.IStandaloneCodeEditor>();
    const previewRef = useRef<HTMLIFrameElement>(null);
    const bundleWorker = useMemo(() => new Worker(
        new URL('/src/worker/bundle.worker.ts', import.meta.url),
        { type: "module" }
    ),[]);

    useEffect(() => {
        console.log("[Sections/Content/index.ts] component did mount");
        if(window.Worker) {
            
            bundleWorker.addEventListener('message', (
                { data }: MessageEvent<iMessageBundleWorker>
            ) => {
				// handle received message...
            }, false);
        }

        return () => {
            bundleWorker.terminate();
        }
    }, []);

    const onSubmitHandler = async (): Promise<void> => {

        bundleWorker.postMessage({
            code: code,
            order: "bundle"
        });
    };

	//...
};

// bundle.worker.ts
import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from '../bundler/plugins/unpkgPathPlugin';
import { fetchPlugins } from '../bundler/plugins/fetch';

type iOrderToWorker = "bundle" | "jsxhighlight" | "eslint";

/***
 * @property {string} code - Code sent from main thread and about to be bundled.
 * @property {string} bundledCode - Bundled code to be send to main tread.
 * @property {Error | null} err - Error occured amoung bundling process.
 * @property {}
 * */ 
export interface iMessageBundleWorker {
    code?: string;
    bundledCode?: string;
    err?: Error | null;
    order: iOrderToWorker;
};

interface iBuildResult {
    code: string;
    err: string;
};

// ...

self.onmessage = (e:MessageEvent<iMessageBundleWorker>): void => {

    // Validate origin
    if(!validateOrigin(e.origin)) return;
    // Filter necessary message
    if(e.data.order !== "bundle") return;

    const { code } = e.data;

    if(code) {
        bundler(code)
        .then((result: iBuildResult) => {
            if(result.err.length) throw new Error(result.err);

            self.postMessage({
                bundledCode: result.code,
                err: null
            });
        })
        .catch((e) => {

            self.postMessage({
                bundledCode: "",
                err: e
            });
        });
    }
}
```

NOTE: codeをサブミットしてworkerへ送信したらEventMessage.originが空だった。

https://html.spec.whatwg.org/multipage/comms.html#the-messageevent-interface

無視するか、

`global.location.origin`でオリジンを取得して相手に送信して判断してもらう手もあるけれど、

結局それは第三者も同じ手を使うことができてしまうので意味がない。

originが空なのは開発中だからかな？

わからん

ひとまずoriginチェックは凍結する。

#### ESLint

検証中

#### JSX Highlight

検証中

## [JavaScript] webworkerについて

https://html.spec.whatwg.org/multipage/workers.html

https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script

- workerは非常に重いのでたくさん生成するものではない
- (専用)workerは`classic script`か`module script`で実行される。
- `classic script`は`<script type="">`もしくは`type`属性なしで指定した場合のscriptのことである。
- `module script`は`<script type="module">`で指定した場合のscriptのことである。

class scriptのトップレベルに定義されたものはグローバルにアクセスできるため、他のscript type=""で埋め込まれたスコープからアクセスできる

module scriptはそれとことなりmoduleからexportしたもののみ他のスコープに公開される。

workerはよく`self`にプロパティを追加する形で関数などを定義するが
（つまり、宣言なしで`self`オブジェクトに追加しているだけ、といういみ）

module workerは`self`にくっつけなくていいのか？

TODO: 調査の続きを。

https://stackoverflow.com/questions/48045569/whats-the-difference-between-a-classic-and-module-web-worker


危険性：

https://security.stackexchange.com/questions/20022/how-to-use-postmessage-securely

- originを検査せよ
- 受信することが期待されるデータの型であるかどうかを検査せよ
- 大量のメッセージを受信しないように単位時間当たりの受信メッセージ数を制限せよ



## メモ

テストコード:

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
