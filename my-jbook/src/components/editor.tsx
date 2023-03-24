import { useState, useEffect, useRef } from 'react';
import { bundler } from '../bundler';
import { Code } from './code';

interface iMessage {
    // NOTE: this message should send identfier to avoid malicious message
    code: string
}


const Editor = () => {
    const previewFrame = useRef<any>(null);
    const [input, setInput] = useState<string>('');
    const [code, setCode] = useState<string>('');

    useEffect(() => {
        // DEBUG: 
    }, [])

    const onClick = async () => {
        // DEBUG: 
        // console.log("[Editor] onClick");
        // console.log(input);

        const result = await bundler(input);

        
        // // DEBUG: 
        // console.log("[Editor] result:");
        // console.log(result);

        setCode(result.code);

        previewFrame.current.postMessage({
            code: result.code
        })
    };

    return (
        <div className="editor-form">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={onClick}>Submit</button>
            <pre>{code}</pre>
            <Code ref={previewFrame} />
        </div>
    );
};

export default Editor;