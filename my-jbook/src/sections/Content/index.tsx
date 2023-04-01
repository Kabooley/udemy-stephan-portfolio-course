import React, { useState, useRef } from 'react';
import { bundler } from '../../bundler';
import Preview from './preview';
import CodeEditor from './Editor/CodeEditor';
import DiffEditor from './Editor/DiffEditor';


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

            const result = await bundler(code);

            // NOTE: DON'T FORGET 'contentWindow', and pass '*'
            previewRef.current.contentWindow.postMessage({
                code: result.code
            }, '*');
        }
    };

    return (
        <div>
            {
                isEditor === "editor"
                ? <CodeEditor onChangeHandler={onChangeHandler} />
                : <DiffEditor />
            }
            <button onClick={onSubmitHandler} >submit</button>
            <Preview ref={previewRef} />
        </div>
    );
}

export default ContentSection;