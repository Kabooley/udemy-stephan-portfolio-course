import type * as editor from '@monaco-editor/react/lib/types';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// import React from 'react';


interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	onMount: editor.OnMount;
};

const defaultValue = "const a = 'AWESOME'";

// monaco-editor Editor component options
const options: monaco.editor.IStandaloneEditorConstructionOptions = {
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

	/***
	 * An event is emitted before the editor is mounted. 
	 * It gets the monaco instance as a first argument
	 * 
	 * handleEditorWillMount()
	 * */ 
	const beforeMount: editor.BeforeMount = (m) => {
		console.log("[monaco] before mount");

		
        m.languages.typescript.typescriptDefaults.setCompilerOptions({
			jsx: m.languages.typescript.JsxEmit.Preserve,
			target: m.languages.typescript.ScriptTarget.ES2020,
			esModuleInterop: true
		});
	};

    /***
     * @param {string | undefined} v - 
     * @param {monaco.editor.IModelContentChangedEvent} e - 
     * 
     * NOTE: Reduxを導入するのは後なのでひとまずバケツリレーで動くものを作る
     * */ 
    const onChange: editor.OnChange = (v, e) => {
        onChangeHandler(v === undefined ? "" : v);
    };

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: editor.OnValidate = (markers) => {
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