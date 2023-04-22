import React, { useMemo, useEffect } from 'react';
import type * as monaco from '@monaco-editor/react';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoEditor from '@monaco-editor/react';


interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	// onMount: monaco.OnMount;
};

interface iMessage {
	signal: string;
	error: string;
};

  

const defaultValue = "const a = 'AWESOME'";

// monaco-editor Editor component options
const options: monacoAPI.editor.IStandaloneEditorConstructionOptions = {
	wordWrap: 'on',
	minimap: { enabled: false },
	showUnused: false,
	folding: false,
	lineNumbersMinChars: 3,
	fontSize: 16,
	scrollBeyondLastLine: false,
	automaticLayout: true,
	colorDecorators: true
};


const CodeEditor = (
	{ onChangeHandler } : iMonacoProps
) => {
	// const refEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
	const ESLintWorker = useMemo(() => new Worker(new URL('../../../worker/eslint.worker.ts', import.meta.url)), []);
	const SyntaxHighlightWorker = useMemo(() => new Worker(new URL('../../../worker/jsx-highlight.worker.ts', import.meta.url)), []);

	// Initialize and clean up workers.
	// 
	// NOTE: useEffect()はMonacoEditor.OnBeforeMount, MonacoEditor.OnMountよりも先に実行される
	useEffect(() => {
		// DEBUG:
		console.log("[CodeEditor] Component did mount.");

		if(window.Worker) {

			ESLintWorker.postMessage({
				signal: "First message to ESLintWorker",
				error: ""
			});
			SyntaxHighlightWorker.postMessage({
				signal: "First message to ESLintWorker",
				error: ""
			});

			ESLintWorker.onmessage = (e: MessageEvent<iMessage>) => {
				const { signal, error } = e.data;
				if(error.length) {
					console.error(error);
				}
				console.log(signal);
			};
			SyntaxHighlightWorker.onmessage = (e: MessageEvent<iMessage>) => {
				const { signal, error } = e.data;
				if(error.length) {
					console.error(error);
				}
				console.log(signal);
			};

			return () => {
				// DEBUG:
				console.log("[CodeEditor] unmount.");
				// clean up code
				ESLintWorker.terminate();
				SyntaxHighlightWorker.terminate();
			}
		}
	}, []);

	// worker message receiver
	// 
	// NOTE: useEffect()はMonacoEditor.OnBeforeMount, MonacoEditor.OnMountよりも先に実行される
	useEffect(() => {
		console.log("[CodeEditor] useEffect():");
		if(window.Worker) {
			// NOTE: メッセージを送信するタイミングとしてなら使えるかも。
		}
	}, [ESLintWorker, SyntaxHighlightWorker]);

	/***
	 * Component Will Mount
	 * 
	 * An event is emitted before the editor is mounted. 
	 * It gets the monaco instance as a first argument
	 * 
	 * handleEditorWillMount()
	 * */ 
	const beforeMount: monaco.BeforeMount = (m) => {
		console.log("[monaco] before mount");

		
        m.languages.typescript.typescriptDefaults.setCompilerOptions({
			jsx: m.languages.typescript.JsxEmit.Preserve,
			target: m.languages.typescript.ScriptTarget.ES2020,
			esModuleInterop: true
		});

		/**
		 * To set ESLint,
		 * Disable typescript's diagnostics for JavaScript files.
		 * This suppresses errors when using Flow syntax.
		 * It's also unnecessary since we use ESLint for error checking.
		 */
		m.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
			noSyntaxValidation: true,
		});
	};

	/**
	 * @param
	 * 
	 * monaco.OnMount()の引数とIMarkerData[]を引き取ってマーカ設定を上書きする
	 * */ 
	// const _updateMarker = (
	// 	e: monacoAPI.editor.IStandaloneCodeEditor, 
	// 	m: typeof monacoAPI, 
	// 	markers: monacoAPI.editor.IMarkerData[], 
	// 	version: number
	// 	) => {
	// 	// // markerをセットする
	// 	// const model = e.getModel();
	// 	// // 本来ここでモデルのバージョンチェックを行うべきらしい
	// 	// // 今はモデル一つしか扱わないからいいね
	// 	// m.editor.setModelMarkers(model, 'eslint', /* NOTE: ここでESLintWorerからのデータをセットする */)
	// };

	/***
	 * 
	 * */
	const onMount: monaco.OnMount = (e, m) => {
		console.log("[monaco] on did mount.");
	};

    /***
     * @param {string | undefined} v - 
     * @param {monaco.editor.IModelContentChangedEvent} e - 
     * 
     * NOTE: Reduxを導入するのは後なのでひとまずバケツリレーで動くものを作る
     * */ 
    const onChange: monaco.OnChange = (v, e) => {
		console.log("[monaco] on change");
        onChangeHandler(v === undefined ? "" : v);
    };

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: monaco.OnValidate = (markers) => {
		console.log("[monaco] on validate");
		console.log(markers);
	};
	
	/**
	 * Event emitted when editor is mounted.
	 * 
	 * syntax highlight
	 * */ 
	// const onDidMount: editor.OnMount = (e, m) => {
	// };

	return (
		<MonacoEditor
			theme='vs-dark'
			width="400px"
			height="300px"
			defaultLanguage='javascript'
			language='javascript'
			defaultValue={defaultValue}
			options={options}
			beforeMount={beforeMount}
			onMount={onMount}
			onChange={onChange}
			onValidate={onValidate}
		/>
	);
};

export default CodeEditor;