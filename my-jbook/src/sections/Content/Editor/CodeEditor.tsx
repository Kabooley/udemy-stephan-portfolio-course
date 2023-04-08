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

// modules for jsx-highlighter
import {parse} from "@babel/parser";
import traverse from "@babel/traverse";
import MonacoJSXHighlighter from 'monaco-jsx-highlighter';

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
	colorDecorators: true
};

/**
 * Options for jsx-highlighter
 * 
 * */ 
const defaultOptions = {
	parser: 'babel', // for reference only, only babel is supported right now
	isHighlightGlyph: false, // if JSX elements should decorate the line number gutter
	iShowHover: false, // if JSX types should  tooltip with their type info
	isUseSeparateElementStyles: false, // if opening elements and closing elements have different styling
	// you can pass your own custom APIs, check core/ and uitls/ for more details
	monacoEditorManager: null,
	decoratorMapper: null,
	jsxCommenter: null,
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
	
	/**
	 * Event emitted when editor is mounted.
	 * 
	 * syntax highlight
	 * */ 
	const onDidMount: editor.OnMount = (e, m) => {
		m.languages.typescript.typescriptDefaults.setCompilerOptions({
			jsx: m.languages.typescript.JsxEmit.Preserve,
			target: m.languages.typescript.ScriptTarget.ES2020,
			esModuleInterop: true
		});
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
			onMount={onDidMount}
			onChange={onChange}
			onValidate={onValidate}
		/>
	);
};

export default CodeEditor;