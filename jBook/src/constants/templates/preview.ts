/***
 * HTML Template for src/sections/Content/preview.tsx iframe content.
 * 
 * */ 
export const previewTemplate = `
<html>
  <head></head>
  <body>
    <div id="root"></div>
      <script>
        window.addEventListener('message', (e) => {
          try {
            console.log(e.data);
            if(e.data === undefined || e.data.code === undefined) throw new Error("Error: property data or data.code is undefined");
            // NOTE: using eval() !
            eval(e.data.code);
          }
          catch(err) {
            const { message, name, stack } = err;
            console.log(trace);
            const root = document.querySelector('#root');
            root.innerHTML = '<div style="color: red;"><h3>' + name + '</h3>' + message + stack +'</div>';
            console.error(err);
          }
        }, false);
      </script>
  </body>
</html>
`;
