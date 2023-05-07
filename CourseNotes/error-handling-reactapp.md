# Note: Section14: Techniques for Error Handling in ReactApp

エディタに実行時エラーが書き込まれたときに、そのエラーを正しくキャプチャしてiframe画面に出力する。

今のところ、

- setTiemout等を利用した遅延エラーに関しては無防備である。
- JavaScriptコードでないコードはエラー表示にならない

これらの解決。

## エラーの種類

SyntaxError
実行時エラー:
    同期エラー：ハンドリング済。
    非同期エラー: 未対応。try...catch()ではcatchされない。

## 非同期エラーへの対処

*Set EventListener for UNCAUGHT Error Event*

`window.addEventListener('error')`を追加して、catchされなかったエラーをここで補足するようにする。

```JavaScript

const html = `
    <html>
      <head>
        <style>html { background-color: white; }</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
        const handleError = (err) => {
              const root = document.querySelector('#root');
              root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>';
              console.error(err);
        };

        // NOTE: NEW ADDED
        window.addEventListener('error', (event) => {
            handleError(event.error);
        });

        window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
                handleError(err);
            }
        }, false);
        </script>
      </body>
    </html>
  `;
```
検証：

```JavaScript
setTimeout(() => {
    // error code 
    asfdsdsa.sfdsfads();
}, 1000);
```
エラーを捕捉してその旨をプレビュー画面に出力できた。

## バンドルエラーのキャプチャ

コンパイルエラーのための表示を実装する。

（実行時エラーと区別するために。）

...
  } catch (err) {
    if (err instanceof Error) {
      return {
        code: "",
        err: err.message,
      };
    } else {
      throw err;
    }
  }
...

バンドラのバンドリング処理中に何かしらエラーが起こったらそれを捕捉するために、
バンドリングプロセスにtry...catch()を設ける。

実際エラーが起こった時に何を返すべきか。

本来正常系ならば文字列を返すべきところ、

エラーが発生したため異常系がエラーメッセージを返すとすると、

受け取る側はエラーが起こったのかどうなのか判断をつけることができない。

その対処：

```TypeScript
// bundler/index.ts

let service: esbuild.Service;
const bundle = async (rawCode: string) => {
  if (!service) {
    service = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  }

  // try...catch()で囲う。
  // バンドリングプロセス中にエラーが発生したらそれを捕捉するため。
  try {
    const result = await service.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(rawCode)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    return {
      code: result.outputFiles[0].text,
      err: '',
    };
  } catch (err) {
    return {
      code: '',
      err: err.message,
    };
  }
};
```

上記のように予め両方のプロパティを持つオブジェクトを返すようにする。

エラーをユーザに表示するために、いままでどおりiframeに表示するのではなくて

iframeの「上」に表示させる。

```TypeScript
// preview.tsx

interface PreviewProps {
  code: string;
  // new added.
  err: string;
};

// ...

const Preview: React.FC<PreviewProps> = ({ code }) => {
  const iframe = useRef<any>();

  useEffect(() => {
    iframe.current.srcdoc = html;
    setTimeout(() => {
      iframe.current.contentWindow.postMessage(code, '*');
    }, 50);
  }, [code]);

  return (
    <div className="preview-wrapper">
      <iframe
        title="preview"
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={html}
      />
      // new added
      { err && <div className="preview-error">{err}</div>}
    </div>
  );
};
```
```css
.preview-error {
  position: absolute;
  top: 10px;
  left: 10px;
  color: red;
}
```
