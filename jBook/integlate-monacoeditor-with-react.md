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

#### 実装： Prettier formatting

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

#### 実装： bundling in worker

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

#### 参考サイトのおさらい

- codesandboxのwebworkerを使う
- メインスレッドはmonaco-editorの`onChange`のタイミングでコードをworkerへ送信する
- workerは`IModelDeltaDecoration`のもととなるデータを返す
- メインスレッドは、メッセージ取得後、`requestAnimationFrame`で`createDecorationsCollection`を呼び出してデータを反映させる

#### コード送信タイミング

結論：現状、`onDidChangeModelContent`の反応するタイミングで良し

参考：

https://github.com/codesandbox/codesandbox-client/blob/196301c919dd032dccc08cbeb48cf8722eadd36b/packages/app/src/app/components/CodeEditor/Monaco/index.js


requestAnimationFrame 
--> onDidChangeModelContent // onchangeサブスクリプションの登録
--> handleChange            // onchangeの実装
--> syntaxHighlight(editor.getModel().getValue(), currentModelTitle, version)

#### コード反映の流れ

onmessage
--> requestAnimationFrame()
--> updateDecorations()
--> createDecorationsCollection()  // deltaDecorationsは非推奨になった

```JavaScript
updateDecorations = async (classifications: Array<Object>) => {
    const decorations = classifications.map(classification => ({
      range: new this.monaco.Range(
        classification.startLine,
        classification.start,
        classification.endLine,
        classification.end
      ),
      options: {
        inlineClassName: classification.type
          ? `${classification.kind} ${classification.type}-of-${
              classification.parentKind
            }`
          : classification.kind,
      },
    }));

    const currentModule = this.currentModule;
    const modelInfo = await this.getModelById(currentModule.id);

    modelInfo.decorations = this.editor.deltaDecorations(
      modelInfo.decorations || [],
      decorations
    );
  };
```

#### やり取りするデータ

参考サイトだとworkerがメインスレッドへ送信するのは`classification`なるオブジェクト。

要はIRangeとIModelDecorationOptionsのプロパティである。

```TypeScript
interface IRange {
    endColumn: number;
    endLineNumber: number;
    startColumn: number;
    startLineNumber: number;
};
```
https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html#inlineClassName

> 設定すると、このCSSクラス名で装飾がテキストとインラインでレンダリングされます。テキストに影響を与えなければならないCSSルールにのみ使用してください。例えば、classNameを使用して背景色の装飾をさせます。

```JavaScript
options: {
    inlineClassName: classification.type
        ? `${classification.kind} ${classification.type}-of-${
            classification.parentKind
        }`
        : classification.kind,
},
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

#### 実装：エディタでimportしているファイルの型定義を動的に取得する

今エディタで、

```TypeScript
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

というコードを書いたとする。

editorの設定で、このエディタが想定するファイルがTypeScriptの場合、

'react'がなんなのかわからんというエラーが出る。

当然である。

@typesやindex.d.tsファイルがこのエディタにインストールされていないからである。

そのため


ユーザが動的にimportするこれらのモジュールの型をどうやってか認識させなければならない。

これの実装。

#### 参考になりそうな情報

https://stackoverflow.com/questions/43058191/how-to-use-addextralib-in-monaco-with-an-external-type-definition/66948535#66948535

https://github.com/microsoft/monaco-editor/issues/1839

https://stackoverflow.com/questions/43058191/how-to-use-addextralib-in-monaco-with-an-external-type-definition

#### 読み取った内容

- `addExtraLib`を使ってエディタでimportするモジュールをアプリケーションの裏側で追加する
- `monaco.languages.typescript.typescriptDefaults.setCompilerOptions`, `monaco.languages.typescript.typescriptDefaults.addExtraLib`で事前の設定を行う
- 言語ごとにモデルを生成(`createModel`) , `monaco.editor.create`や`setModel`でエディタに反映させる

となるとエディタにユーザが追加したimport文は動的に追加したものなので、上記のようにあらかじめ用意したモジュール用の解決策はうまくいかない？

#### 実装してみる: デフォルトvalueのimport文の追加

- index.tsxがmodelのもととなるpathをpropsでeditorコンポーネントへ渡す
  pathが変更されたら再レンダリングが発生する

ちょっとこんがらがってきた！

処理の流れを初めに洗い出して

#### メモ

- `react-dom/client`
- `react`
- `bulma/css/bulma.css`

上記の3つをaddExtraLibで追加する

すること

- languageはpathと別だけど、pathの扱う言語と同じでなくてはならないだろう
- pathにmodelの元となる情報を用意しておく
- pathファイルでimortしているモジュールをaddExtraLibsで追加する(どんなタイミングでもいいのかも)
- `@monaco-editor/react`の仕様に合わせるならば、`Editor`コンポーネントの`path`プロパティに渡すだけでいい
  pathからlanguageを取得するようにさせる、defualtLanguageはtypescriptにしておく

@monaco-editor/reactの場合pathをみてモデルを変更するが、addExtraLibsを動かすのは開発者側の責任なので

pathの変更をトリガーする機能を用意してaddExtraLibsを発動させるようにしなくてはならない



```TypeScript
// editorインスタンスは生成済とする
const editor = monaco.editor.create(/*  ...  */);

// pathの場所にmodelの前提となるファイルを用意しておく
// 参考
// https://github.com/satya164/monaco-editor-boilerplate/blob/master/src/App.js
// そうやら前提ファイルは文字列で保存しておけばよいみたい
const files = {
  'main.tsx': `import React from 'react'; ...`;
};

const props = {
  files: files,
  path: 'main.tsx',
  value: files['main.tsx'],
};

// --- parent component ---
// --- editor component ---


/**
 * @param {string} path - path that file located.
 * @param {string} value - 
 * 
 * 一度createModelしたら、あとはmonaco.editor.getModels()から生成済modelを取得することができるみたい
 * */ 
const createModel = ({ path, value, language }) => {
  let model = monaco.editor.getModels().find(m => m.uri.path === path);
  if(model) {
    /* update the model */ 
  }
  else {
    model = monaco.editor.createModel(
      value,
      language,
      new monaco.Uri().with({ path })
    );
    /* update the new model */ 
  }
};

const applyModel = ({ path, value, language }) => {
  const model = monaco.editor.getModels().find(m => m.uri.path === path);
  editor.setModel(model);
  // reset subscribers
};
```

#### Multi Model

@monaco-editor/reactはマルチモデルエディタに...対応しているとは公式が言っている。

https://github.com/suren-atoyan/monaco-react#multi-model-editor

とはいえたとえば、extraLibとか対応できるの？

TODO: 公式のソースを確認して@monaco-editor/reactをまだ使うか検討する
TODO: 気になる：editor.setSelection()とは？

#### monaco-editorが想定するマルチモデル

だいたいこんな感じ：

- fileをあらかじめ用意しておく
- fileからmodelをcreateModelする
- editorインスタンスにsetModelする
- どこかにmodelの最後の情報を保存しておく



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



## 解析：Satyajittのmonaco-editor-boilerplate

fileをここに用意した：

`rootDir/Satyajitt-monaco.js`

知りたいこと：

- multi modelエディタをどうやって実現しているか
- jsx highlightをどうあって実現しているか

componentDidMount():

```JavaScript

/***
 * @param this.props
 * files: { [path: stirng]: string }で、modelに適用させるモジュールとそのパスの組み合わせだと思う
 * path: stringで
 * 
 * */ 
  componentDidMount() {
    // Intialize the linter
    this._linterWorker = new ESLintWorker();
    this._linterWorker.addEventListener('message', ({ data }: any) =>
      this._updateMarkers(data)
    );

    // Intialize the type definitions worker
    // 
    // 使用言語に応じた、必要なライブラリをその都度更新している
    this._typingsWorker = new TypingsWorker();
    this._typingsWorker.addEventListener('message', ({ data }: any) =>
      this._addTypings(data)
    );

    // Fetch some definitions
    const dependencies = {
      expo: '29.0.0',
      react: '16.3.1',
      'react-native': '0.55.4',
    };

    Object.keys(dependencies).forEach(name =>
      this._typingsWorker.postMessage({
        name,
        version: dependencies[name],
      })
    );

    /**
     * @param {stirng} path - 
     * @param {stirng} value - 
     * 
     * */ 
    const { path, value, ...rest } = this.props;

    /**
     * this._node: DOMを指している。editorを挿入するDOM
     * rest?: IStandaloneEditorConstructionOptions
     * override?: IEditorOverrideServices
     * */ 
    this._editor = monaco.editor.create(
        this._node, 
        rest, 
      {
        // IEditorOverrideServicesは調べたとこｒなんでも「足す」ことができるみたいで
        // codeEditorServiceなるものは開発者の独自関数である
        codeEditorService: Object.assign(Object.create(codeEditorService), {
            openCodeEditor: async ({ resource, options }, editor) => {
            // Open the file with this path
            // This should set the model with the path and value
            this.props.onOpenPath(resource.path);

            // Move cursor to the desired position
            editor.setSelection(options.selection);

            // Scroll the editor to bring the desired line into focus
            editor.revealLine(options.selection.startLineNumber);

            return Promise.resolve({
                getControl: () => editor,
            });
            }
        }),
    });

    
    // 既存のmodelを最新の状態に更新するもしくは新規にmodelを生成する
    Object.keys(this.props.files).forEach(path =>
      this._initializeFile(path, this.props.files[path])
    );

    // setModel()他をする
    this._openFile(path, value);
    this._phantom.contentWindow.addEventListener('resize', this._handleResize);
  }
```

- `Object.assign(Object.create(codeEditorService), {})`

codeEditorSErviceをprototypeにした新しいオブジェクトを生成する。

assignで第二引数をそのオブジェクトに上書きする。

- `this._initializeFile()`


```JavaScript
_initializeFile = (path: string, value: string) => {

    // 引数のpathと一致する、生成済のmodelを探す
    let model = monaco.editor
      .getModels()
      .find(model => model.uri.path === path);

    if (model) {
        // 生成済のmodelが存在するなら
        // そのmodelを最後に使った状態に戻すのと、最新の状態に更新する
      // If a model exists, we need to update it's value
      // This is needed because the content for the file might have been modified externally
      // Use `pushEditOperations` instead of `setValue` or `applyEdits` to preserve undo stack
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ]
      );
    } else {
      model = monaco.editor.createModel(
        value,
        'javascript',
        new monaco.Uri().with({ path })
      );
      model.updateOptions({
        tabSize: 2,
        insertSpaces: true,
      });
    }
  };
```

- `this._openFile()`

```JavaScript
_openFile = (path: string, value: string) => {
    this._initializeFile(path, value);

    const model = monaco.editor
      .getModels()
      .find(model => model.uri.path === path);

    // pathに一致するmodelをエディタに適用する
    this._editor.setModel(model);

    // Restore the editor state for the file
    const editorState = editorStates.get(path);

    if (editorState) {
      this._editor.restoreViewState(editorState);
    }

    this._editor.focus();

    // サブスクリプションを適用したモデル専用に更新する
    // Subscribe to change in value so we can notify the parent
    this._subscription && this._subscription.dispose();
    this._subscription = this._editor.getModel().onDidChangeContent(() => {
      const value = this._editor.getModel().getValue();

      this.props.onValueChange(value);
      this._lintCode(value);
    });
  };
  ```

## [monaco-editor] addExtraLib

https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages.typescript.LanguageServiceDefaults.html#addExtraLib

> ソース ファイルを言語サービスに追加します。これは、jquery.d.ts などのエディター ドキュメントとして読み込まれない typescript (定義) ファイルに使用します。

  流れ：

  選択言語に必要なライブラリを取得
  `monaco.language.typescript.javascriptDefaults.addExtraLib()`でライブラリを追加
  あとでdisposeできるように戻り値を保存しておく

```JavaScript
// 例
  _addTypings = ({ typings }) => {
    Object.keys(typings).forEach(path => {
      let extraLib = extraLibs.get(path);

      extraLib && extraLib.dispose();
      extraLib = monaco.languages.typescript.javascriptDefaults.addExtraLib(
        typings[path],
        path
      );

      extraLibs.set(path, extraLib);
    });
  };
```

- `addExtraLib`は`_addTypings`から、componentDidMountで呼び出されている
- `