# Note: Section 15: Creating a Markdown Editor in a ReactApp

Markdownエディタとそのプレビューコンポーネントとの作成。

ぶっちゃけパッケージに少しの修正とスタイリングを追加するだけ。。。

## @uiw/react-md-editor

というnpmパッケージを使う。

```bash
$ yarn add @uiw/react-md-editor@2.1.1 --legacy-peer-deps --exact
```

## 編集モードとプレビューモード切り替え

ワンクリックでトグルするようになっている。

#### 条件付きトグル

*クリックしたのがエディタの内側か外側か？*

エディタの外をクリックしたrあプレビューに、

内側ならばそのまま編集画面、というようにしたい。

その手順：

- `MouseEvent`のtarget要素を取得する
- 予めrefで参照している要素なのか比較する
- 比較結果をsetEditing()へ渡す


```TypeScript
import { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';

const TextEditor: React.FC = () => {
    const ref = useRef<HTMLDivELement | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const listener = () => {
      if(ref.current && event.target && ref.current.contains(event.target as Node)) {
        // Click inside of Editor.
        return;
      }
      setEditing(false);
    };
    document.addEventListener('click', listener, { capture: true });

    return () => {
      document.removeEventListener('click', listener, { capture: true });
    }
  }, []);


  if(editing) {
    return (
      <div ref={ref} >
        <MDEditor />
      </div>
    );
  }

  return (
    <div onClick={() => setEditing(true)}>
      <MDEditor.Markdown source={'# Header'} />
    </div>
  );
};

export default TextEditor;
```



#### Broken Cursor

CSSセレクタ名の衝突によるスタイリングの崩壊が起こっている。

エディタに入力された方にスタイリングが適用されてしまっている。

## Why the Broken cursor?

マークダウンエディタにおいてカーソルの表示がおかしくなってしまう件について

テキストエリアにはテキストを入力できるけれど、

テキストエリアに表示されているのは`textarea`要素ではなくて実は`pre`要素だったのである。

だからテキストエリアにシンタックスハイライトやスタイルが適用されているのである。

#### Solving class name conflicts

markdown-editor のパッケージが

スタイルの適用で important をつけているため、これを外すと通常のテキストエリアの表示と同じになる。

なので CSS ルールを上書きする。

ADD `src/components/text-editor.css`

```CSS
/* これでもいいけど... */
.w-md-editor .title {
    line-height: unset !important;
    font-size: unset !important;
    font-weight: unset !important;
}

/* こうする */
.w-md-editor .title {
    line-height: unset;
    font-size: unset;
    font-weight: unset;
}
```

この方法はパッケージが採用しているスタイリングのクラス名を上書きする行為なので一般的でない解決方法である。


#### マークダウンエディタ下部の縁を小さくする

```css
/* text-editor.css */
.w-md-editor .title {
    line-height: unset;
    font-size: unset;
    font-weight: unset;
}

.w-md-editor ul {
    line-height: 1;
}
```

## リサイズハンドルの再スタイリング

今はインストールしたパッケージの通りのスタイリングのハンドルなので

既に作成済むのハンドルと同じスタイリングにしてみよう

`resizable.css`のハンドルの3点リーダを持ってくる

```css

.react-resizable-handle-s {
  height: 10px;
  width: 100%;
  cursor: row-resize;
  /* これ */
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
}

/* text-editor.css */
.text-editor .w-md-editor-bar {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
  height: 11px;
  cursor: row-resize;
  background-color: #37414b;
  background-repeat: no-repeat;
  background-position: 50%;
  width: 100%;
  position: relative;
}
```

## ダークテーマの適用

はコピペしてくれとのことで割愛。

このセクションはこれ以降も割愛。