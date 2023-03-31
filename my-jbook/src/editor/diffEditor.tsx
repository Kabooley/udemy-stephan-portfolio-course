import React from 'react';
import { DiffEditor as MonacoEditor } from '@monaco-editor/react';
import type * as monaco from '@monaco-editor/react';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';

// monaco editor Editor component options
const options: monacoAPI.editor.IStandaloneEditorConstructionOptions = {
	wordWrap: 'on',
	minimap: { enabled: false },
	showUnused: false,
	folding: false,
	lineNumbersMinChars: 3,
	fontSize: 16,
	scrollBeyondLastLine: false,
	automaticLayout: true,
}


const DiffEditor = () => {

    /***
	 * An event is emitted before the editor is mounted. 
	 * It gets the monaco instance as a first argument
	 * 
	 * handleEditorWillMount()
	 * */ 
	const beforeMount: monaco.BeforeMount = (m) => {
		console.log("[monaco] before mount");
	};

	/**
	 * Event emitted when editor is mounted.
	 * */ 
	const onDidMount: monaco.OnMount = (e, m) => {
		console.log("[monaco] on did mount");
	};

    return (
        <div className="">
            <MonacoEditor
                width="400px"
                height="300px"
                language='JavaScript'
                // defaultValue={defaultValue}
                // value={value}
                // onChange={onChange}
                // onValidate={onValidate}
                options={options}
                beforeMount={beforeMount}
                onMount={onDidMount}
            />
        </div>
    );
}