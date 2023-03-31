
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type * as editor from '@monaco-editor/react/lib/types';
import React, { useState, useEffect, useRef } from 'react';

interface iMonacoProps {
	onChange: editor.OnChange,
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
const Editor = ({
	onChange, value
}: iMonacoProps) => {
	const refEditor = useRef<monaco.editor.IStandaloneCodeEditor>();

	/***
	 * An event is emitted before the editor is mounted. 
	 * It gets the monaco instance as a first argument
	 * 
	 * handleEditorWillMount()
	 * */ 
	const beforeMount: editor.BeforeMount = (monaco) => {
		console.log("[monaco] before mount");
	};

	/**
	 * Event emitted when editor is mounted.
	 * */ 
	const onDidMount: editor.OnMount = (editor, monaco) => {
		console.log("[monaco] on did mount");
		refEditor.current = editor;
	};

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

export default Editor;