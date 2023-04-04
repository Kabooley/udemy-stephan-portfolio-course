import React, { useState, useRef, useEffect } from 'react';
import { bundler } from '../../bundler';
import { previewTemplate } from '../../constants/templates/preview';
import Preview from './preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';

import prettier from 'prettier';
import parser from 'prettier/parser-babel';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
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
     * editor.OnDidMountを利用する
     * */ 
    const onFormatHandler = () => {
        // TODO: define how to format with prettier
        // get current value
        // format them
        // set formatted value
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
                    ref={editorRef} 
                  />
                : <DiffEditor />
            }
            <button className="button" onClick={onSubmitHandler} >submit</button>
            <button className="button format" onClick={onFormatHandler} >submit</button>
            <Preview ref={previewRef} />
        </div>
    );
}

export default ContentSection;