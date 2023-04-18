import React, { useMemo, useEffect } from 'react';
import type * as monaco from '@monaco-editor/react';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoEditor from '@monaco-editor/react';


interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	onMount: monaco.OnMount;
};

interface iMessage {
	signal: string;
	error: string;
  }
  

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
	{ onChangeHandler, onMount } : iMonacoProps
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

			//
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
		if(window.Worker) {
			
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

		}
	}, [ESLintWorker, SyntaxHighlightWorker]);

	/***
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

    /***
     * @param {string | undefined} v - 
     * @param {monaco.editor.IModelContentChangedEvent} e - 
     * 
     * NOTE: Reduxを導入するのは後なのでひとまずバケツリレーで動くものを作る
     * */ 
    const onChange: monaco.OnChange = (v, e) => {
        onChangeHandler(v === undefined ? "" : v);
    };

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: monaco.OnValidate = (markers) => {
		console.log("[monaco] on validate");
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