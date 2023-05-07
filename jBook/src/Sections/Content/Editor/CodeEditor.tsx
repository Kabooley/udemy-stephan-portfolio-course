import React, { useMemo, useEffect, useRef } from 'react';
import type * as monacoReact from '@monaco-editor/react';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoEditor from '@monaco-editor/react';
import prettier from 'prettier';
import parser from 'prettier/parser-babel';

import type { iClassification, iSyntaxHighlightMessageData } from '../../../worker/jsx-highlight.worker';

interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	// onMount: monaco.OnMount;
};

const defaultValue = "import { createRoot } from 'react-dom/client';\r\nimport React from 'react';\r\nimport 'bulma/css/bulma.css';\r\n\r\nconst App = () => {\r\n    return (\r\n        <div className=\"container\">\r\n          <span>REACT</span>\r\n        </div>\r\n    );\r\n};\r\n\r\nconst root = createRoot(document.getElementById('root'));\r\nroot.render(<App />);";

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


/**
 * TODO: 検討：formattingはコンテキストメニューに移行するかボタンのままにするか
 * */ 
const setFormatter = (m: typeof monacoAPI): void => {

    // DEBUG:
    console.log("[App] setFormatter");

    m.languages.registerDocumentFormattingEditProvider(
		"javascript",
		{
			async provideDocumentFormattingEdits(
                model, options, token) {
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

				return [{
					range: model.getFullModelRange(),
					text: formatted,
				}];
			}
		});
};

/**
 * Set TypeScript compiler options to monaco-editor
 * 
 * 参考：
 * 
 * https://github.com/satya164/monaco-editor-boilerplate/blob/master/src/Editor.js
 * */ 
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
	
	// m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
	//    noSemanticValidation: false,
	//    noSyntaxValidation: false,
	// });
	
	// m.languages.typescript.typescriptDefaults.addExtraLib(
	// 	reactDefFile,
	// 	`file:///node_modules/@react/types/index.d.ts`
	// );

};



const CodeEditor = (
	{ onChangeHandler } : iMonacoProps
) => {
	const _editorRef = useRef<monacoAPI.editor.IStandaloneCodeEditor>();
	const _monacoRef = useRef<typeof monacoAPI>();
	const jsxHighlightWorker = useMemo(() => new Worker(new URL('../../../worker/jsx-highlight.worker.ts', import.meta.url)), []);
	// const ESLintWorker = useMemo(() => new Worker(new URL('../../../worker/eslint.worker.ts', import.meta.url)), []);


	useEffect(() => {
		// DEBUG:
		console.log("[CodeEditor] Component did mount.");

		if(window.Worker) {

            jsxHighlightWorker.addEventListener('message', _cbJsxHighlight, false);

			return () => {
				jsxHighlightWorker.removeEventListener('message', _cbJsxHighlight, false);
				jsxHighlightWorker.terminate();
				// ESLintWorker.terminate();
			}
		}
	}, []);

	/***
	 * Before create MonacoEditor editor instance. 
	 * 
	 * - set prettier formatter
	 * 
	 * */ 
	const beforeMount: monacoReact.BeforeMount = (m) => {
		console.log("[monaco] before mount");
		_monacoRef.current = m;
		setFormatter(m);
		setCompilerOptions(m);
	};

	/***
	 * Did create MonacoEditor editor instance.
	 * */
	const onMount: monacoReact.OnMount = (e, m) => {
		console.log("[monaco] on did mount.");
		
		m.editor.setModelLanguage(e.getModel()!, "typescript");

		console.log(m.languages.typescript.typescriptDefaults.getCompilerOptions());
		if(_editorRef.current === undefined) {
			_editorRef.current = e;
			console.log(_editorRef.current?.getModel()?.getLanguageId());
		}
	};

    /***
	 * On change occured on the monaco editor model.
     * */ 
    const onChange: monacoReact.OnChange = (v, e) => {
		console.log("[monaco] on change");
        onChangeHandler(v === undefined ? "" : v);

		// Send code to apply jsx decoration
		/**
		 * Is mode TypeScript or JavaScript?
		 * Is new code not equal previous code?
		 * 
		 * */ 
		if(_editorRef.current) {
			const m: iSyntaxHighlightMessageData = {
				code: _editorRef.current.getModel()!.getValue(),
				title: "",
				version: _editorRef.current.getModel()!.getVersionId(),
				order: "jsxhighlight"
			};
			jsxHighlightWorker.postMessage(m);
		}
    };

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: monacoReact.OnValidate = (markers) => {
		console.log("[monaco] on validate");
		console.log(markers);
	};

	/***
	 * 
	 * */ 
	const _cbJsxHighlight = (
		{ data }: MessageEvent<{classifications: iClassification[], version: number}>
		) => {
			const { classifications, version } = data;
			const model = _editorRef.current?.getModel();
			if(model && model.getVersionId() !== version) return;

			// DEBUG:
			console.log("[CodeEditor] Apply jsx highlight");
			console.log(classifications);

			const decorations: monacoAPI.editor.IModelDeltaDecoration[] = classifications.map(classification => ({
				range: new monacoAPI.Range(
					classification.startLineNumber,
					classification.startColumn,
					classification.endLineNumber,
					classification.endColumn,
				),
				options: {
					// Check type is undefined 
					inlineClassName: classification.type
						? `${classification.kind} ${classification.type}-of-${classification.parentKind}`
						: classification.kind
				}
			}));

			console.log(decorations);

			_editorRef.current?.createDecorationsCollection(decorations);
	};

	return (
		<MonacoEditor
			theme='vs-dark'
			width="600px"
			height="500px"
			defaultLanguage='typescript'
			language='typescript'
			defaultPath='main.tsx'
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
};

export default CodeEditor;