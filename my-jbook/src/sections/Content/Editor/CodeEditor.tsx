import type * as editor from '@monaco-editor/react/lib/types';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useState, useEffect, useRef } from 'react';

interface iMonacoProps {
	onChangeHandler: (v: string) => void;
	value: string
}

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
}

/**
 * make Monaco editor like VSCode
 * 
 * 
 * TODO: monaco と editorのインスタンスの違いとは？
 * TODO: editor.tsxとmonaco.tsxの機能をもっとわかりやすくすみわけできないかしら
 * TODO: VSCodeのようにしたい
 * TODO: eslint
 * TODO: prettier
 * TODO: エラーはいライティング
 * */ 
const CodeEditor = ({
	onChangeHandler, value
}: iMonacoProps) => {
	const refEditor = useRef<monaco.editor.IStandaloneCodeEditor>();

	/***
	 * An event is emitted before the editor is mounted. 
	 * It gets the monaco instance as a first argument
	 * 
	 * handleEditorWillMount()
	 * */ 
	const beforeMount: editor.BeforeMount = (m) => {
		console.log("[monaco] before mount");
	};

	/**
	 * Event emitted when editor is mounted.
	 * */ 
	const onDidMount: editor.OnMount = (e, m) => {
		console.log("[monaco] on did mount");
		refEditor.current = e;
	};

    /***
     * @param {string | undefined} value - 
     * @param {monaco.editor.IModelContentChangedEvent} e - 
     * 
     * NOTE: Reduxを導入するのは後なのでひとまずバケツリレーで動くものを作る
     * */ 
    const onChange: editor.OnChange = (value, e) => {
        onChangeHandler(value === undefined ? "" : value);
    }

	/***
	 * Event emitted when the content of the current model is changed
	 * and current markers are ready.
	 * */ 
	const onValidate: editor.OnValidate = (markers) => {
		console.log("[monaco] on validate");
	};

	return (
		<MonacoEditor
			width="400px"
			height="300px"
			defaultLanguage='JavaScript'
			defaultValue={defaultValue}
			options={options}
			value={value}
			beforeMount={beforeMount}
			onMount={onDidMount}
			onChange={onChange}
			onValidate={onValidate}
		/>
	);
}

export default CodeEditor;