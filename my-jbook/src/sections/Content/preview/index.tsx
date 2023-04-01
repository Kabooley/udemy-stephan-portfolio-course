import { forwardRef } from 'react';

const previewTemplate = `
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

const Preview = forwardRef((props: any, previewRef: any) => {
    return (
        <>
            <iframe  
                ref={previewRef}
                srcDoc={previewTemplate}   
                sandbox="allow-scripts" 
                {...props}
            />
        </>
    );
});

export default Preview;