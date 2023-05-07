import React, { useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import type * as monacoReact from '@monaco-editor/react';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoEditor from '@monaco-editor/react';
import prettier from 'prettier';
import parser from 'prettier/parser-babel';

import type { iClassification } from '../../../worker/jsx-highlight.worker';

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

const setCompilerOptions = (m: typeof monacoAPI) => {

	// m.languages.typescript.typescriptDefaults.setCompilerOptions({
	// 	target: m.languages.typescript.ScriptTarget.Latest,
	// 	allowNonTsExtensions: true,
	// 	moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
	// 	module: m.languages.typescript.ModuleKind.CommonJS,
	// 	noEmit: true,
	// 	esModuleInterop: true,
	// 	jsx: m.languages.typescript.JsxEmit.React,
	// 	reactNamespace: "React",
	// 	allowJs: true,
	// 	typeRoots: ["node_modules/@types"],
	//   });
	
	// m.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
	//    noSemanticValidation: false,
	//    noSyntaxValidation: false,
	// });
	
	// m.languages.typescript.typescriptDefaults.addExtraLib(
	// 	reactDefFile,
	// 	`file:///node_modules/@react/types/index.d.ts`
	// );
};


/***
 * 
 * */ 
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

            jsxHighlightWorker.addEventListener('message', (
                { data }: MessageEvent<{classifications: iClassification[], version: number}>
                ) => {
                    const { classifications, version } = data;
					const model = _editorRef.current?.getModel();
					if(model && model.getVersionId() !== version) return;

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

					_editorRef.current?.createDecorationsCollection(decorations);
            }, false);


			return () => {
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
	};

	/***
	 * Did create MonacoEditor editor instance.
	 * */
	const onMount: monacoReact.OnMount = (e, m) => {
		console.log("[monaco] on did mount.");
		if(_editorRef.current === undefined) {
			_editorRef.current = e;
		}
	};

    /***
	 * On change occured on the monaco editor model.
     * */ 
    const onChange: monacoReact.OnChange = (v, e) => {
		console.log("[monaco] on change");
        onChangeHandler(v === undefined ? "" : v);
    };

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: monacoReact.OnValidate = (markers) => {
		console.log("[monaco] on validate");
		console.log(markers);
	};

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