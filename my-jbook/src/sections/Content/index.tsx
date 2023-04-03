import React, { useState, useRef } from 'react';
import { bundler } from '../../bundler';
import { previewTemplate } from '../../constants/templates/preview';
import Preview from './preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';
import './index.css';


type iIsEditor = "editor" | "diffEditor";

const ContentSection = () => {
    const [isEditor, setIsEditor] = useState<iIsEditor>("editor");
    const [code, setCode] = useState<string>("");
    const previewRef = useRef<HTMLIFrameElement>(null);

    const onChangeHandler = (value: string): void => {
        setCode(value);
    };

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
                ? <CodeEditor onChangeHandler={onChangeHandler} />
                : <DiffEditor />
            }
            <button className="button" onClick={onSubmitHandler} >submit</button>
            <Preview ref={previewRef} />
        </div>
    );
}

export default ContentSection;