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

#### bundling処理をworkerへ移す

ってのはどうだい？

bundling logicをworkerへ移すにあたって...

- workerファイルがimportするモジュールもworkerでなくてはならないのか？

bundling logic振り返り：

- `bundler(code)`を呼び出すだけ。

やること:

- webpack.config.jsのentryにbundle.worker.tsを追加する
- codeをonSubmitするコンポーネントでworkerを生成する。
- worker生成時、`type: moduele`を指定する(ES6 import文が必要なので)。


#### ESLint

検証中

#### JSX Highlight

検証中