import React, { useState, useRef, useEffect } from 'react';
import { bundler } from '../../bundler';
import { previewTemplate } from '../../constants/templates/preview';
import Preview from './preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';

import prettier from 'prettier';
import parser from 'prettier/parser-babel';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as editor from '@monaco-editor/react/lib/types';
import './index.css';

// millisec
const DELAY: number = 500;

type iIsEditor = "editor" | "diffEditor";


/**
 * TODO: 遅延バンドリングの実装
 * - useEffectで入力が始まったらタイマーをセットする
 * - 
 * 
 * 
 * */ 
const ContentSection = (): JSX.Element => {
    // set iIsEditor
    const [isEditor, setIsEditor] = useState<iIsEditor>("editor");
    const [code, setCode] = useState<string>("");
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const previewRef = useRef<HTMLIFrameElement>(null);

    const onChangeHandler = (value: string): void => {
        setCode(value);
    };

    /**
     * Implementation of @monaco-editor/react MonacoEditor component handler.
	 * Event emitted when editor is mounted.
	 * */ 
	const onDidMount: editor.OnMount = (e, m) => {
        // DEBUG:
		console.log("[monaco] on did mount");
        
        editorRef.current = e;

        // こっちを使えば公式の提供する方法でフォーマッティングができる模様
        // 
        // 
        m.languages.registerDocumentFormattingEditProvider('javascript', {
            provideDocumentFormattingEdits(model, options, toke) {
                const text = prettier.format(model.getValue(), {
                    parser: 'babel',
                    plugins: [parser],
                    useTabs: false,
                    semi: true,
                    singleQuote: true,    
                })
                .replace(/\n$/, '');
                
                return [{
                    range: model.getFullModelRange,
                    text
                }]
            }
        });

        // m.languages.typescript.typescriptDefaults.setCompilerOptions({
		// 	jsx: m.languages.typescript.JsxEmit.Preserve,
		// 	target: m.languages.typescript.ScriptTarget.ES2020,
		// 	esModuleInterop: true
		// });
		// m.languages.typescript.typescriptDefaults.setCompilerOptions({
		// 	target: m.languages.typescript.ScriptTarget.ES2016,
		// 	allowNonTsExtensions: true,
		// 	moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
		// 	module: m.languages.typescript.ModuleKind.CommonJS,
		// 	noEmit: true,
		// 	typeRoots: ["node_modules/@types"],
		// 	jsx: m.languages.typescript.JsxEmit.React,
		// 	jsxFactory: 'JSXAlone.createElement',
		//   })
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