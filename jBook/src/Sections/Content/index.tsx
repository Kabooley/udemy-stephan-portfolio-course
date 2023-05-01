import React, { useState, useRef, useEffect, useMemo } from 'react';

import prettier from 'prettier';
import parser from 'prettier/parser-babel';
import * as monacoAPI from 'monaco-editor/esm/vs/editor/editor.api';

import Preview from './Preview';
import { previewTemplate } from '../../constants/templates/preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';
import './index.css';
// import { bundler } from '../../bundler';
// import type * as monaco from '@monaco-editor/react'


type iIsEditor = "editor" | "diffEditor";


const ContentSection = (): JSX.Element => {
    // set iIsEditor
    const [isEditor, setIsEditor] = useState<iIsEditor>("editor");
    const [code, setCode] = useState<string>("");
    const editorRef = useRef<monacoAPI.editor.IStandaloneCodeEditor>();
    const previewRef = useRef<HTMLIFrameElement>(null);
    const bundleWorker = useMemo(() => new Worker(
        new URL('/src/workers/bundle.worker.ts', import.meta.url)
    ),[]);

    useEffect(() => {
        console.log("[Sections/Content/index.ts] component did mount");
        if(window.Worker) {
            // send message to worker if needed.
            bundleWorker.addEventListener('message', ({ data }) => {
                // TODO: apply bundled code to editor model.
            }, false);
        }

        return () => {
            bundleWorker.terminate();
        }
    }, []);

    const onChangeHandler = (value: string): void => {
        setCode(value);
    };

    /**
     * editor.OnDidMountを利用する
     * 
     * - コードのフォーマットを行う
     * 
     * TODO: send code to worker instead.
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