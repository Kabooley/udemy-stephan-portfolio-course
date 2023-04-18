/***
 * NOTE: ひとまずwebworkerが動くのかだけ確認する
 * 
 * */ 
interface iMessage {
  signal: string;
  error: string;
}

self.onmessage = (e: MessageEvent<iMessage>) => {
  const { signal } = e.data;

  console.log(signal);

  if(signal === undefined) {
    self.postMessage({
      signal: "",
      error: "[ESLint.worker] Error: Something went wrong but there is no signal has been sent."
    })
  }

  self.postMessage({
    signal: "This is ESLint.worker. I've got your message.",
    error: ""
  });


  setTimeout(() => {
    self.postMessage({
      signal: "This is ESLint.worker. Delayed message has been sent.",
      error: ""
    });
  }, 15000);
}

// import ESLint from '../vendor/eslint.bundle';
// import config from '../config/eslint.json';

// self.onmessage = (e: MessageEvent<>) => {
//     const { code, version } = e.data;

//     try {
//       const markers = ESLint.verify(code, config).map(err => ({
//         startLineNumber: err.line,
//         endLineNumber: err.line,
//         startColumn: err.column,
//         endColumn: err.column,
//         message: `${err.message} (${err.ruleId})`,
//         severity: 3,
//         source: 'ESLint',
//       }));
  
//       self.postMessage({ markers, version });
//     } catch (e) {
//       /* Ignore error */
//     }
// };