import { useState, useEffect, useRef } from 'react';
import { bundler } from '../bundler';


const Editor = () => {
    const ref = useRef<any>();
    const [input, setInput] = useState<string>('');
    const [code, setCode] = useState<string>('');

    useEffect(() => {
        // DEBUG: 
        // console.log("[Editor] effect");
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
    };

    return (
        <div className="editor-form">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={onClick}>Submit</button>
            <pre>{code}</pre>
        </div>
    );
};

export default Editor;