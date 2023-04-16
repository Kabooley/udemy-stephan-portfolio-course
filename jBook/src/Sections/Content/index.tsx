import React, { useState, useRef, useEffect } from 'react';

import prettier from 'prettier';
import parser from 'prettier/parser-babel';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';
import type * as monaco from '@monaco-editor/react'

import { bundler } from '../../bundler';
import Preview from './Preview';
import { previewTemplate } from '../../constants/templates/preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';
import './index.css';


type iIsEditor = "editor" | "diffEditor";


const ContentSection = (): JSX.Element => {
    // set iIsEditor
    const [isEditor, setIsEditor] = useState<iIsEditor>("editor");
    const [code, setCode] = useState<string>("");
    const editorRef = useRef<monacoAPI.editor.IStandaloneCodeEditor>();
    const previewRef = useRef<HTMLIFrameElement>(null);

    const onChangeHandler = (value: string): void => {
        setCode(value);
    };

    /**
     * Implementation of @monaco-editor/react MonacoEditor component handler.
	 * Event emitted when editor is mounted.
	 * */ 
	const onDidMount: monaco.OnMount = (e, m) => {
        // DEBUG:
		console.log("[monaco] on did mount");
        
        editorRef.current = e;

        // NOTE: formatting via official method
        // m.languages.registerDocumentFormattingEditProvider('javascript', {
        //     provideDocumentFormattingEdits(model, options, toke) {
        //         const text = prettier.format(model.getValue(), {
        //             parser: 'babel',
        //             plugins: [parser],
        //             useTabs: false,
        //             semi: true,
        //             singleQuote: true,    
        //         })
        //         .replace(/\n$/, '');
                
        //         return [{
        //             range: model.getFullModelRange,
        //             text
        //         }]
        //     }
        // });
	};

    /**
     * editor.OnDidMountを利用する
     * 
     * - コードのフォーマットを行う
     * */ 
    const onFormatHandler = () => {
        if(editorRef.current === undefined) return;

        // FORMAT
        const unformatted = editorRef.current.getValue();

        // DEBUG:
        console.log(unformatted);

        const formatted = prettier.format(unformatted, {
            parser: 'babel',
            plugins: [parser],
            useTabs: false,
            semi: true,
            singleQuote: true,    
        })
        .replace(/\n$/, '');

        // DEBUG:
        console.log(formatted);

        editorRef.current.setValue(formatted);
    }

    const onSubmitHandler = async (): Promise<void> => {
        if(previewRef.current && previewRef.current.contentWindow) {

            // NOTE: To prevent srcdoc to be empty by user.
            previewRef.current.srcdoc = previewTemplate;

            const result = await bundler(code);

            // NOTE: DON'T FORGET 'contentWindow', and pass '*'
            previewRef.current.contentWindow.postMessage({
                code: result.code
            }, '*');
        }
    };

    return (
        <div className="content-section">
            {
                isEditor === "editor"
                ? <CodeEditor 
                    onChangeHandler={onChangeHandler} 
                    onMount={onDidMount}
                  />
                : <DiffEditor />
            }
            <button className="button" onClick={onSubmitHandler} >submit</button>
            <button className="" onClick={onFormatHandler} >format</button>
            <Preview ref={previewRef} />
        </div>
    );
}

export default ContentSection;