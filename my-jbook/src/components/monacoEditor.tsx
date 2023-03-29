import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type * as editor from '@monaco-editor/react/lib/types';
import React, { useState, useEffect, useRef } from 'react';

interface iMonacoProps {
	onChange: editor.OnChange,
	value: string
}

const defaultValue = "const a = 'AWESOME'";

const options: monaco.editor.IStandaloneEditorConstructionOptions = {

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
export const Monaco = ({
	onChange, value
}: iMonacoProps) => {

	/**
	 * What is different between editor instance and monaco instance?
	 * 
	 * */ 
	const onMountHandler: editor.OnMount = (editor, monaco) => {
		// ref.current = editor;
	}

	return (
		<Editor
			width="400px"
			height="300px"
			defaultLanguage='JavaScript'
			defaultValue={defaultValue}
			options={options}
			value={value}
			onMount={onMountHandler}
			onChange={onChange}
		/>
	);
}