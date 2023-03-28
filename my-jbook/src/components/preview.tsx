import { forwardRef } from 'react';

const html = `
<html>
  <head></head>
  <body>
    <div id="root">
      <script>
        window.addEventListener('message', (e) => {
          try {
            console.log(e);
            if(e.data === undefined || e.data.code === undefined) throw new Error("Error: property data or data.code is undefined");
            // NOTE: using eval() !
            eval(e.data.code);
          }
          catch(err) {
            console.error(err);
          }
        }, false);
      </script>
    </div>
  </body>
</html>
`;


export const Preview = forwardRef((props: any, previewFrame: any) => {
    return (
        <>
            <iframe  
                ref={previewFrame}
                srcDoc={html}   
                sandbox="allow-scripts" 
                {...props}
            />
        </>
    );
});