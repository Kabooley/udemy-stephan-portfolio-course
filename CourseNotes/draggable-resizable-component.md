# Note: Section 13: Draggable and Resizable components

エディタとプレビュー画面をリサイズ・ＤＮＤできるようにするよ


## リサイジング

エディタとプレビューをリサイジング可能にする

#### `react-resizable`

```bash
$ cd jbook
$ npm install --save-exact react-resizable@3.0.4 @types/react-resizable@3.0.2 --legacy-peer-deps
$ yarn add --exact react-resizable@3.0.4 @types/react-resizable@3.0.2 --legacy-peer-deps
```

```TypeScript
// components/resizable.tsx
import './resizable.css';
import { ResizableBox } from 'react-resizable';

interface ResizableProps {
  direction: 'horizontal' | 'vertical';
  children?: React.ReactNode;
};

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  return (
    <ResizableBox height={300} width={Infinity} resizeHandles={['s']}>
      {children}
    </ResizableBox>
  );
};

export default Resizable;
```
```TypeScript
// src/components/code-cell.tsx

import { useState } from 'react';
import CodeEditor from './code-editor';
import Preview from './preview';
import bundle from '../bundler';
import Resizable from './resizable';

const CodeCell = () => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');

  const onClick = async () => {
    const output = await bundle(input);
    setCode(output);
  };

  return (
    <Resizable direction="vertical">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
        <CodeEditor
          initialValue="const a = 1;"
          onChange={(value) => setInput(value)}
        />
        <Preview code={code} />
      </div>
    </Resizable>
  );
};

export default CodeCell;
```

Resizable が CodeEditor & Preview　をラッピングする。

## リサイズがうまくいかない問題

今垂直方向にコンポーネントをリサイズ可能になっているが、

リサイズ処理を高速に行うとリサイズイベントが適切に送信されずにおかしな挙動になる。

たとえば高速にドラッグしてからドロップすると、

ドロップイベントが受理されずに、

すでに手放したはずのハンドルがいつまでもマウスカーソルについてくるなどである。

また一番下までハンドルを下げてリサイズすると今度はハンドルが上に行かなくなるなどである。

その問題の解決。

CSSの疑似要素を使うことで解決できる。

```TypeScript
// preview.tsx

// iframeをdiv.preview-wrapperでラッピングして...
import './preview.css';

// ...
  return (
    <div className="preview-wrapper">
      <iframe
        style={{ backgroundColor: 'white' }}
        title="preview"
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={html}
      />
    </div>
  );
```
```css
/* 下記のcssをつける */
.preview-wrapper {
    position: relative;
    height: 100%;
}

/* previewコンポーネントの上に表示される追加されたDOM要素 */
.preview-wrapper:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    /* 挙動確認のため */
    background-color: red;
}
```

react-resizableはハンドルをドラッグ中には、

`div.react-draggable-transparent-selection`という要素が追加される仕様になっている。

```css
.preview-wrapper {
    position: relative;
    height: 100%;
}

/* 縦方向いっぱいにプレビューコンポーネントを表示させるため */
.preview-wrapper iframe {
    height: 100%;
    background-color: white;
}

/* 仕様上追加されるようにも反映させるため */
.react-draggable-transparent-selection .preview-wrapper:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    opacity: 0;
}
```
これでおかしな挙動はなくなった。

#### 垂直方向のリサイジング制限

`maxConstraints`, `minConstraints`を指定する

```TypeScript
// resizable.tsx 

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  return (
    <ResizableBox 
      minConstraints={[Inifinity, 24]}
      maxConstraints={[Infinity, window.innerHeight * 0.9]}
      height={300} width={Infinity} 
      resizeHandles={['s']}
    >
      {children}
    </ResizableBox>
  );
};
```

これで水平方向には無限にリサイズ出来て、

垂直方向にはウィンドウの内部サイズの90％までしかリサイズできないように制限した。

最小サイズも書いてある通り。

## 水平方向のリサイズ

resizable.tsxの出力内容をprops引数`direction`で変えるようにする。

水平方向リサイズラッパーはCodeEditorをラッピングする。

```TypeScript
// code-cell.tsx
const CodeCell = () => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');

  const onClick = async () => {
    const output = await bundle(input);
    setCode(output);
  };

  return (
    <Resizable direction="vertical">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
        // NOTE: 新規にResizableを追加した。  
        <Resizable direction="horizontal">
          <CodeEditor
            initialValue="const a = 1;"
            onChange={(value) => setInput(value)}
          />
        </Resizable>
        <Preview code={code} />
      </div>
    </Resizable>
  );
};
```

```TypeScript
// resizables.tsx

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  let resizableProps: ResizableBoxProps;

  if(direction === 'horizontal') {
    // ここに水平方向のリサイザのプロパティを定義すればいいだけ
    resizableProps = {
      minConstraints:[window.innerWidth * 0.2, Infinity],
      maxConstraints:[window.innerWidth * 0.75, Infinity],
      height: Infinity,
      width: window.innerWidth * 0.75,
      resizeHandles:['e']
    };
  }
  else {
    resizableProps = {
      minConstraints:[Infinity, 24],
      maxConstraints:[Infinity, window.innerHeight * 0.9],
      height:300,
      width:Infinity,
      resizeHandles:['s']
    }
  };

  return (
    // spread構文でプロパティを渡せばよい
    <ResizableBox {...resizableProps}>
      {children}
    </ResizableBox>
  );
};
```

#### エディタとプレビュー画面を適切に表示させる

現在エディタが幅をとりすぎている。

```CSS
.preview-wrapper {
    position: relative;
    height: 100%;
    /* NOTE: added */
    flex-grow: 1;
}

.preview-wrapper iframe {
    height: 100%;
    background-color: white;
    /* NOTE: added */
    width: 100%;
}

.react-draggable-transparent-selection .preview-wrapper:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    opacity: 0;
}
```

#### 文字列htmlにスタイリングする方法

htmlは文字列で埋め込みされるので、styleタグを使えばよい。

```TypeScript
const html = `
    <html>
      <head>
        <style>html { background-color: white; }</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
              const root = document.querySelector('#root');
              root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>';
              console.error(err);
            }
          }, false);
        </script>
      </body>
    </html>
  `;
```

## ウィンドウサイズの変更との連動

今のところ、リサイズハンドルを使った変更には対応しているけれど、

ウィンドウ自体のサイズ変更に対応ができていない。

#### onresize event

*`useEffect()`を使って`onResize`イベント監視*

以下のように`window.innerWidth`を使うと、

ウィンドウ幅を変更したりされてもwindow.innerWidthは再計算されない。

```TypeScript

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  let resizableProps: ResizableBoxProps;

  if(direction === 'horizontal') {
    resizableProps = {
      className: "resize-horizontal",
      minConstraints:[window.innerWidth * 0.2, Infinity],
      maxConstraints:[window.innerWidth * 0.75, Infinity],
      height: Infinity,
      width: window.innerWidth * 0.75,
      resizeHandles:['e']
    };
  }
  else {
    resizableProps = {
      minConstraints:[Infinity, 24],
      maxConstraints:[Infinity, window.innerHeight * 0.9],
      height:300,
      width:Infinity,
      resizeHandles:['s']
    }
  };

  return (
    <ResizableBox {...resizableProps}>
      {children}
    </ResizableBox>
  );
};
```

そのためonresizeイベントを監視してイベントが発生するたびに再計算するようにしなくてはならない。

```TypeScript
// resizable.tsx
import { useEffect } from 'react';

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  let resizableProps: ResizableBoxProps;

  // NOTE: added useEffect to reset window 
  useEffect(() => {
    const listener = () => {
      // reset compnent size
    };
    window.addEventListener('resize', listener);

    return () => {
      window.removeEventListener('resize', listener);
    };
  }, []);
  // ...
};
```

初めてレンダリングされたときにイベントリスナを設置して、クリーンアップされるときにremoveされる。

```TypeScript
import './resizable.css';
import { useState, useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import type { ResizableBoxProps } from 'react-resizable';

interface ResizableProps {
  direction: 'horizontal' | 'vertical';
  children?: React.ReactNode;
};

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  const [innerHeight, setInnerHeight] = useState(window.innerHeight);
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  let resizableProps: ResizableBoxProps;

  useEffect(() => {
    const listener = () => {
      setInnerHeight(window.innerHeight);
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener('resize', listener);

    return () => {
      window.removeEventListener('resize', listener);
    };
  }, []);

  if(direction === 'horizontal') {
    resizableProps = {
      className: "resize-horizontal",
      minConstraints:[innerWidth * 0.2, Infinity],
      maxConstraints:[innerWidth * 0.75, Infinity],
      height: Infinity,
      width: innerWidth * 0.75,
      resizeHandles:['e']
    };
  }
  else {
    resizableProps = {
      minConstraints:[Infinity, 24],
      maxConstraints:[Infinity, innerHeight * 0.9],
      height:300,
      width:Infinity,
      resizeHandles:['s']
    }
  };

  return (
    <ResizableBox {...resizableProps}>
      {children}
    </ResizableBox>
  );
};

export default Resizable;
```

これでウィンドウサイズの変更に応じて再計算されるようになった。

今のところ確認できる問題:

- 水平方向にリサイズしたあとで、ウィンドウ幅を変更するとリサイズ位置が初期位置に戻ってしまう問題
- ウィンドウのリサイズにラグがある、もしくは反応しすぎている。



#### リサイズのラグが発生する問題について

おなじみの手法で、setTimeoutを使う。

バウンスという手法らしい。

```TypeScript

const Resizable: React.FC<ResizableProps> = ({ direction, children }) => {
  const [innerHeight, setInnerHeight] = useState(window.innerHeight);
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  let resizableProps: ResizableBoxProps;

  useEffect(() => {
    let timer: any;
    const listener = () => {
      if(timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        setInnerHeight(window.innerHeight);
        setInnerWidth(window.innerWidth);
      }, 100);
    };
    window.addEventListener('resize', listener);

    return () => {
      window.removeEventListener('resize', listener);
    };
  }, []);
  // ...
};
```


#### ウィンドウ幅を変更するとリサイズバーが初期位置に戻ってしまう問題

要は、Resizableコンポーネントと、ResizableBoxコンポーネントでそれぞれ別々の「幅」のプロパティを持つことによって生じる歪みによって引き起こされる問題である。

まず、水平方向リサイズのハンドル（リサイズコンポーネント）は、エディタコンポーネントをラッピングしている。

Resizableコンポーネントの幅が、今650pxでレンダリングされたとする。

そのとき、react-resizableのコンポーネント（ResizableBox）にも650pxとして、内部的に持っているプロパティwidthに登録される。

今、ユーザがこの水平ハンドルを使ってエディタを縮めて、250pxにしたとする。

この時、resizableコンポーネントの幅は650pxのままだけれど、

ResizableBoxの幅は250pxで登録される。

> ここでの全体の問題は、ResizableBoxコンポーネントが、現在のwidthが何であるかを決定するために、独自の内部管理された状態を持っていることです。Resizableコンポーネントをレンダリングするたびに、このwidth propに新しい値を提供すると、内部の状態の部分を上書きするか変更します。
> そしてこれがジャンプを引き起こす原因です。

#### widthの同期

- リサイズハンドルを水平方向に動かした後にウィンドウのリサイズが変更する問題の解決
- ウィンドウ幅を狭くしすぎるとプレビュー画面が消える問題の解決

```TypeScript
// resizable.tsx

// new added.
const [width, setWidth] = useState(window.innerWidth * 0.75);

// inside of useEffect()...
// NOTE: widthを依存関係配列に追加しておいて
const listener = () => {
    // ...
    timer = setTimeout(() => {
        // ...
        // new added.
        if(window.innerWidth * 0.75 < width) {
            setWidth(window.innerWidth * 0.75);
        }
    }, 100)
}

if(direction === 'horizontal') {
    resizableProps = {
        // ...
        // width: window.innerWidth * 0.75;
        width: width,
        onResizeStop: (event, data) => {
            setWidth(data.size.width);
        },
    }
}
```

## Realtime bundling and displaying

ユーザが入力したコードをリアルタイムにプレビュー画面に出力させる。

パフォーマンスのために、

ユーザ入力が起こって1秒間入力がなかったらバンドリングプロセスを実行するようにする。

```TypeScript
// code-cell.tsx

import { useState, useEffect } from 'react';


const CodeCell = () => {
    // ...

    useEffect(() => {
        const timer = setTimeout(async () => {
            const output = await bundle(input);
            setCode(output);
        }, 1000);

        return () => {
            clearTimeout(timer);
        }
    }, [input]);

    // Delete onClick()
}
```

これでユーザがコードを入力して１秒後にバンドルプロセスを実行できる。

#### 実行タイムアウトの追加

今、アプリケーションのエディタに次のように入力したとする。

```JavaScript
const root = document.querySelector('#root');

root.innerHTML = "adsfsa";
```

プレビュー画面には`adsfsa`が表示されるはずだが、一瞬だけ表示されて何もなかったかのように消えてしまう。

この原因。

今のところ、入力されたコードがpreviewにたどり着くまでの道のりは...

`code-cell.tsx`でバンドリングプロセスが実行される

バンドリングプロセスがバンドルコードを返し、`setCode`でstate管理されている`code`が更新される。

`Preview`コンポーネントへバンドルコードが渡される。

`Preview`はprops経由でバンドルコードを取得して、useEffect()によってiframe内へそのコードをポストする...

すると、iframeへコンテンツを送信するときにイベントリスナのセットアップに時間がとられてメッセージの監視を開始する前にすでにメッセージは送信済になっているのである。

そのためバンドルされたコードを含むメッセージは処理されずに、iframe内部は初期値のコードを初めて受け取ることになるのである。

ということでiframeの初期化の猶予を与えることにする。

```TypeScript
// preview.tsx before
  useEffect(() => {
    iframe.current.srcdoc = html;
    iframe.current.contentWindow.postMessage(code, '*');
  }, [code]);

// preview.tsx after
  useEffect(() => {
    iframe.current.srcdoc = html;
    setTimeout(() => {
      iframe.current.contentWindow.postMessage(code, '*');
    }, 50);
  }, [code]);

```