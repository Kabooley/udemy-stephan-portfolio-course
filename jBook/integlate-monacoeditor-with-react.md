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

結論：EventMessage.originは空文字列になってしまって検査の仕様がないためorigin検査は見送る。

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

#### Optimizing Performance worker vs. fetch

bundlingプロセスは講義の通りfetchするのとworker使うのとどちらがいいのだろうか。

パフォーマンスという側面で検証する。



#### 実装：ESLint

検証中

#### 実装：JSX Highlight

NOTE: update 20230505: monaco-editorはデフォでjsxハイライト対応とのこと

https://github.com/microsoft/monaco-editor/issues/264#issuecomment-733981409

ただし適用のさせ方使い方わからん

https://github.com/microsoft/monaco-editor/issues/264#issuecomment-654578687これをplaygroundで試してみる

- 最新の参考サイトのやり方を参考にJSXハイライトworkerを実装

参考：

https://github.com/codesandbox/codesandbox-client/blob/master/packages/app/src/sandbox/eval/transpilers/typescript/typescript-worker.ts



上記のcodesandboxのgithubリポジトリよりわかること：

- importScriptsで取得した`ts`は以下の通りにすればtypescriptが理解してくれる
- 代わりに`self.ts`呼出はしなくなった

https://github.com/codesandbox/codesandbox-client/blob/196301c919dd032dccc08cbeb48cf8722eadd36b/packages/app/src/app/components/CodeEditor/Monaco/workers/syntax-highlighter.js

上記のURLは古いリポジトリのもので、masterブランチのものだとアップデートされていた。

(そうなると現在のsyntsxhighlighterのファイルを探しなおさないといかんけどな)

```TypeScript
import type * as TypeScriptType from 'typescript';

self.importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/typescript/3.4.1/typescript.min.js'
);

declare const ts: typeof TypeScriptType;

async function compile(data) {
  const { code, path, config, typescriptVersion } = data;

  if (typescriptVersion !== '3.4.1') {
    self.importScripts(
      `https://unpkg.com/typescript@${typescriptVersion}/lib/typescript.js`
    );
  }

  const defaultConfig = {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
        // ts....呼出がエラーにならない
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowJs: true,
      alwaysStrict: true,
      downlevelIteration: true,
      noImplicitUseStrict: false,
      jsx: ts.JsxEmit.React,
      forceConsistentCasingInFileNames: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noImplicitAny: true,
      strictNullChecks: true,
      suppressImplicitAnyIndexErrors: true,
      noUnusedLocals: true,
      inlineSourceMap: true,
      inlineSources: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      lib: ['es2017', 'dom'],
    },
  };
// ...
```

#### 処理の流れ

- onChangeイベントでコードを取得する
- onChangeハンドラでworkerへコードを送信する
- workerを参考サイトのリポジトリを参考に実装
- メインスレッドのonmessageでworkerから返された値を反映させる(何をどう反映させるのか未確認)
- 反映するときはanimation何とかを使うみたい？




#### メインスレッドへ渡すデータの型

```TypeScript
interface iClassification {
    // IRange properties
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    // 
    kind: string;       // TypeScriptType.SyntaxKind;
    parentKind: string; // TypeScriptType.SyntaxKind;
    type: string;       // TypeScriptType.Node
};
```
最終的に、

`IModelDeltaDecoration`のプロパティである

`IRange`と`IModelDecorationOptions`を渡せればよい。

`createDecorationsCollection`を呼び出すためである。

`kind`, `parentKind`, `type`は実際には上記のコメントの通りの型であるが、

最終的には文字列で連結されるのでstring型でよい。

（いろいろと都合がよい）

#### jsx highlightの反映とcss

typescriptがjsxを認識していない模様。

そのため、iClassificationを生成するときにtokenをjsxではなく、

たとえば`<`演算子として認識している。

となるとcompileroptionか。




#### エディタの言語設定をtypescriptにしても型付けを受け付けない問題

結論：`@monaco-editor/react`の場合、`defaultPath`プロパティに`.tsx`のファイル名を指定する

ファイル名は何でもいい模様

----

エディタで以下のように入力すると

```TypeScript
import { createRoot } from 'react-dom/client';
import React from 'react';
import 'bulma/css/bulma.css';

// 以下のような型付けはtypescritpファイルでのみ受け付けますというエラーが出る
const App: React.JSX.Element = () => {
    return (
        <div className="container">
          <span>REACT</span>
        </div>
    );
};

```

言語設定:

```TypeScript
const setCompilerOptions = (m: typeof monacoAPI) => {

	/**
	 * Configure the typescript compiler to detect JSX and load type definitions
	 */
	const compilerOptions: monacoAPI.languages.typescript.CompilerOptions = {
		allowJs: true,
		allowSyntheticDefaultImports: true,
		alwaysStrict: true,
		// jsx: monacoAPI.languages.typescript.JsxEmit.React,
		// jsx: 2,
		jsxFactory: 'React.createElement',
		target: m.languages.typescript.ScriptTarget.Latest,
		allowNonTsExtensions: true,
		moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
		module: m.languages.typescript.ModuleKind.ESNext,
		noEmit: true,
		esModuleInterop: true,
		jsx: m.languages.typescript.JsxEmit.React,
		reactNamespace: "React",
		typeRoots: ["node_modules/@types"],
	};
	
	m.languages.typescript.typescriptDefaults.setCompilerOptions(
		compilerOptions
	);
	m.languages.typescript.javascriptDefaults.setCompilerOptions(
		compilerOptions
	);
};

// ...

// @monaco-editor/react BeforeMount handler
// 
// 以下のようにcompilerOptionを設定してもダメ
	const beforeMount: monacoReact.BeforeMount = (m) => {
		console.log("[monaco] before mount");
		_monacoRef.current = m;
		setFormatter(m);
		setCompilerOptions(m);
	};

    // ...

	return (
		<MonacoEditor
			theme='vs-dark'
			width="600px"
			height="500px"
			defaultLanguage='typescript'
			language='typescript'
			// defaultLanguage='javascript'
			// language='javascript'
			defaultValue={defaultValue}
			options={options}
			beforeMount={beforeMount}
			onMount={onMount}
			onChange={onChange}
			onValidate={onValidate}
		/>
	);
```

setModelLanguage()を呼び出してもダメ。

```TypeScript
const onMount: monacoReact.OnMount = (e, m) => {
		console.log("[monaco] on did mount.");
		
        // ここでの呼び出しは意味ないかも？
		m.editor.setModelLanguage(e.getModel()!, "typescript");

		console.log(m.languages.typescript.typescriptDefaults.getCompilerOptions());
		if(_editorRef.current === undefined) {
			_editorRef.current = e;
			console.log(_editorRef.current?.getModel()?.getLanguageId());
		}
	};
```

どうもcreateEditorするときにせっとするmodelに、`.tsx`ファイルを読み込ませないといかんみたいに指摘する記事がちらほら

https://github.com/cancerberoSgx/jsx-alone/blob/master/jsx-explorer/HOWTO_JSX_MONACO.md

@monaco-editor/reactの場合、`defaultPath`でpath指定できる模様

https://github.com/suren-atoyan/monaco-react#multi-model-editor

上記の公式でデモがあってその通りにすればいい感じ。

つまり、

`defaultPath`プロパティに`.tsx`のファイル名を指定すればよいだけ。

問題はtypescript言語設定がこれで有効になったものの、このアプリケーションの仕様上import文でインポートしているモジュールが使えない点

これはどういうアプリにするかという問題につながる。


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
