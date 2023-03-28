import { useState, useRef } from 'react';
import { bundler } from '../bundler';
import { Preview } from './preview';

const Editor = () => {
    const previewFrame = useRef<any>();
    const [input, setInput] = useState<string>('');

    // useEffect(() => {
    //     // DEBUG: 
    // }, []);

    const onClick = async () => {

        // DEBUG: 
        console.log("[Editor] onClick");
        console.log(input);

        const result = await bundler(input);

        // // DEBUG: 
        console.log("[Editor] result:");
        console.log(result.code);

        // NOTE: DON'T FORGET 'contentWindow', and pass '*'
        previewFrame.current.contentWindow.postMessage({
            code: result.code
        }, '*');
    };

    return (
        <div className="editor-form">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={onClick}>Submit</button>
                {/* <Preview previewFrame={previewFrame} /> */}
                <Preview ref={previewFrame} />
        </div>
    );
};

export default Editor;