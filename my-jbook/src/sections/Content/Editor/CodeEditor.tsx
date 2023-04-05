/**
 * make Monaco editor like VSCode
 * 
 * TODO: VSCodeのようにしたい
 * TODO: eslint
 * TODO: prettier
 * TODO: エラーはいライティング
 * */ 
import type * as editor from '@monaco-editor/react/lib/types';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React from 'react';

interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	onMount: editor.OnMount;
};

const defaultValue = "const a = 'AWESOME'";

// monaco editor Editor component options
const options: monaco.editor.IStandaloneEditorConstructionOptions = {
	wordWrap: 'on',
	minimap: { enabled: false },
	showUnused: false,
	folding: false,
	lineNumbersMinChars: 3,
	fontSize: 16,
	scrollBeyondLastLine: false,
	automaticLayout: true,
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
	
	// /**
	//  * Event emitted when editor is mounted.
	//  * */ 
	// const onDidMount: editor.OnMount = (e, m) => {
	// 	console.log("[monaco] on did mount");
	// 	refEditor.current = e;
	// 	ref.current = e;
	// };

	return (
		<MonacoEditor
			theme='vs-dark'
			width="400px"
			height="300px"
			defaultLanguage='JavaScript'
			language='javaScript'
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