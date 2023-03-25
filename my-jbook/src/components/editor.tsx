import { useState, useEffect, useRef } from 'react';
import { bundler } from '../bundler';
// import { Code } from './code';
// interface iMessage {
//     // NOTE: this message should send identfier to avoid malicious message
//     code: string
// };

const htmlTemplate = `
<html>
  <head></head>
  <body>
    <div id="root">
      <script>
        window.addEventListener('message', (e) => {
          try {
            console.log(e);
            // TODO: evalじゃない方法
            eval(e.data);
          }
          catch(err) {
            // ここにエラー時にどうするかの挙動を設ければよい
            console.error(err);
          }
        }, false);
      </script>
    </div>
  </body>
</html>
`;


const Editor = () => {
    const previewFrame = useRef<any>();
    const [input, setInput] = useState<string>('');
    const [code, setCode] = useState<string>('');

    useEffect(() => {
        // DEBUG: 
    }, [])

    /**
     * TODO: I think this click handler is not async
     * 
     * If I want this to be executed asynchrnously, then I should call this 
     * like this...
     *             <button onClick={onClick}>Submit</button>
     * to be like tihs
     *             <button onClick={await onClick()}>Submit</button>
     * */ 
    const onClick = async () => {

        // DEBUG: 
        console.log("[Editor] onClick");
        console.log(input);

        const result = await bundler(input);

        
        // // DEBUG: 
        console.log("[Editor] result:");
        console.log(result);

        setCode(result.code);

        console.log(previewFrame.current.contentWindow);
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
            <pre>{code}</pre>
                <iframe  
                    ref={previewFrame}
                    srcDoc={htmlTemplate}   
                    sandbox="allow-scripts" 
                />
        </div>
    );
};

export default Editor;