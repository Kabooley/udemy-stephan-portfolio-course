/****
 * Context for execute JavaScript code that user input into textarea.
 * 
 * 
 * */ 
const hmltTemplate = `
<html>
  <head></head>
  <body>
    <div id="root">
      <script>
        window.addEventListener('message', (e) => {
          try {
            // TODO: evalじゃない方法
            eval(e.data);
          }
          catch(err) {
            // ここにエラー時にどうするかの挙動を設ければよい
          }
        }, false);

      </script>
    </div>
  </body>
</html>
`;

export const Code = ({ ref }: { ref: any}) => {
    return (
        // TODO: refはdivに渡していいのか、iframeに渡すべきなのか
        <div ref={ref} >
            <iframe srcDoc={hmltTemplate} sandbox="" />
        </div>
    );
}