# Note: Section 10 Safely Handling Untrusted COde Execution

big challangeの一つ、ユーザコードの実行の実現。

JavaScriptコードを実行させるとは、どう実現すればいいのか？

実行できるようになったとして、もしもユーザが

- 間違ったコードを記述したとき
- 悪意のあるコードを記述したとき

どうすべきか

## Big Issues with code execution

ユーザは悪意のあるコードを簡単に埋め込むことができる。

#### `iFrame`を使う

- iFrameとは

HTMLタグ`iFrame`はネストされたブラウザの実行環境であり、他のHTMLのなかに埋め込まれるHTMLである。

各ブラウザ実行環境にはそれぞれセッション履歴と`document`を持つ。

iFrameが埋め込まれた方のブラウザ実行環境は親ブラウザ実行環境と呼ばれる。

最上位のブラウジング コンテキスト (親を持たないコンテキスト) は通常、Window オブジェクトによって表されるブラウザー ウィンドウです。

iFrameは完全なブラウザ実行環境なので安易にiframeを増やすとメモリを圧迫する。

#### iFrameと親環境はお互いアクセスすることが可能である

検証環境：

`jbook/public/another-context.html`というファイルを用意して、

`jbook/public/index.html`に、

```html
<iframe src="./another-context.html" ></iframe>
```

を追記する。

これでアプリケーションを実行して...

親環境と埋め込み環境の共有されるものとされないものを確認する。

```bash
# In chrome DevTools console
# 
# Choosing parent context
> window.a = 1
> const color = "red"
> window.a
1
> color
red

# Change context to embedded context
> window.a
Error window.a is not exist
> color
Error color is not exist
# parentを使うと親環境のオブジェクトを取得できてしまう！
> parent.a
1 
> window.b = 2
2

# Change context to parent context
> window.b
undefined       # 親が子の定義したものを取得できないけれど...

# 次の方法で取得することができてしまう
> document.querySelector('iframe').contentWindow
# 子環境のグローバルオブジェクトを取得できてしまうので...
> const childWindow = document.querySelector('iframe').contentWindow
> childWindow.b
2   # 取得できてしまう
```

実は、特に制限しない限り親環境と子環境は相互に通信できてしまう。

iframeは`sandbox`をしていすることで制限または制限解除を指定できる。

#### Sandboxing an iFrame

iframeと(親環境が)相互アクセスができる条件は...

- `iframe`が`sandbox`プロパティを持たないとき、または`sandbox="allow-same-origin"`プロパティを持つとき

- その`iframe`と全く同じドメイン、ポート、プロトコルからの通信された場合にのみフレーム間で直接アクセスできる

#### `sandbox`とは

iframeのできることを制限するiframeタグの属性である。

iframeに`sandbox`とだけ書いておくと、親環境との相互アクセスなどすべての制約を適用し、

`sandbox`を記述していないiframeは基本的にすべて許可という状態になる。

`sandbox="allow-xxxx"`のように許可する機能を明示的に指定する必要がある。

#### ユーザコード実行に伴う危険と現状解決できそうなもの

- ユーザが入力したコードが起こしたエラーがアプリケーションをクラッシュさせてしまうかも
    --> iframe内で実行させればエラーはiframe内で完結するので解決

- ユーザが入力したコードはDOMを変更する可能性があり、アプリケーションをクラッシュさせてしまう可能性がある

    --> iframe内で実行させればアクセスできるDOMはiframe内だけなので解決

- 他の悪意のある第三者が、ユーザに悪意のあるコードを実行させる可能性がある

    --> iframeの通信を制限すれば解決できる

#### ユーザ入力コード実行チャート

下記はひとまず参考としているcodepenが採用している処理の流れである。

1. @Application user changes code

2. @API-domain-1 transpile that code and send it when iframe requested.

3. @Application reload iframe from API-domain-1

4. @Application fetch HTML doc from API-domain-2

5. @Application fetch and run JavaScript from API-domain-2

これは我々のアプリケーションに適用できるのか？

異なるドメインサーバを複数用意する必要があるのか？

それは、これはローカルで実行させるアプリケーションでセキュリティ上の心配がないから（ひとまずは）必要ないといえるとのこと。

とはいえ後でセキュリティ上の懸念事項に対処することになるよ

- iframe内でユーザコードが入力される

- ブラウザがバンドリング・トランスパイリング

- 別のiframe内で結果を出力



#### ローカルアプリケーションは`localhost:3000`と通信してindex.htmlを得るようにさせる

いずれこのアプリケーションは拡張させる

なので結局後からセキュリティ上の問題に直面することになる

iframeと親環境が通信できないようにするために今後ことなるドメインやポートからhtmlなどを取得するようにしなくてはならなくなる。

セキュリティ上の問題を解決するためにインフラを構築する必要があるということである。

セキュリティ上の問題を解決するために、このインフラを構築する方法をとらずに別のアプローチを試みる。

そしてそれは技術的に可能である。

つまりこうである。

iframeは`sandbox=""`とすれば直接アクセスができなくなるので

親コードとユーザ入力コードを分離することはこの小さな変更だけで可能なのである。

つまり折衷案のようなものである。


```
そこで、私たちはこのようなことをやってみようと思います。

これが私たちの解決策になりそうです

最終的にはlocalist 4,000,5を用意する予定です。

今、技術的にはすべてlocalist 4000またはlocalhost 3000で動いていることを思い出してください。

すべてをロードします。

ユーザーがコードを変更できるようにする。

ブラウザの中で直接、すべてのバンドル処理を行います。

その後、iFrameを再読み込みし、iFrameにサンドボックスの空の文字列属性を割り当てます。

いずれはそこに何らかの値を入れる予定ですが、今は空の文字列だけにしておきます。

その後、iFrameをリロードして、HTMLドキュメントを取得し、それをiFrame内にロードして、バンドルされているJavaScriptコードをその中にどうにか取り込もうと思います。

そして、iframeに適用した設定により、iframe内部で実行されるコードは外部ドキュメントや親ドキュメントにアクセスすることができなくなります。

これが、私たちが望んでいたセキュリティレベルです。

さて、そうは言っても、私たちが導入しているソリューションについて、1つだけ非常に簡単な注意点をお伝えしたいと思います。それは、ユーザーがアプリの内部で書くことができるコードの種類に、1つか2つの小さな制限があることです。

これは、このアプローチの残念な欠点です。

マイナス面もあります。

その欠点とは、アプリケーションを使用するユーザーが、ローカルストレージを使用できなくなることです。

また、彼らが書くコードの中で、他のいくつかの事柄でクッキーにアクセスすることができなくなります。

言い換えれば、最終的にこのようなものをすべて実装し、ユーザーが何かを内部に入れた場合、ローカルストレージのようなものであれば、まだ何でもない項目で、このコードは残念ながら私たちがここで考え出した解決策では期待通りに動作しないでしょう。

ですから、これは一種のトレードオフなのです。

私たちのソリューションは、インフラを大幅に削減することができます。

非常に高速に動作します。

余分なHTMLドキュメントなどをマッチングさせる必要がないので、ユーザーコードの実行が非常に速くなります。

デメリットとしては、ローカルストレージのようなブラウザ上の機能へのアクセスができなくなることです。

つまり、これもトレードオフの関係です。

しかし、最終的には、これが最も興味深い解決策であると判断し、Ephram'sについてもっと理解することを余儀なくされました。

エフラムのことをより深く理解することができますし、インフラを構築する量も制限されます。

ですから、私の意見では、このアプリは、このコースの目的では、まともでハッピーでミディアム、中間的なものだと思います。

さて、議論はここまでにして、次のビデオで実装を始めましょう。

トランスクリプション
さて、最後のビデオですが、何度も繰り返してしまいました、申し訳ありません。

最終的には、ローカルで実行する場合には、このようなセキュリティに関する多くのことは必要ない、という結論に達しました。

という結論に達しました。

しかし、私たちは、いずれはこのようなセキュリティ機能を搭載することになるだろうと判断しました。

www.DeepL.com/Translator（無料版）で翻訳しました。
```

### `src` vs `srcDoc`

src:

> 埋め込むページの URL。 about:blank の値を使用して、同一生成元ポリシーに準拠する空のページを埋め込みます。 <iframe> の src 属性をプログラムで削除すると (Element.removeAttribute() などを介して)、about:blank が Firefox (バージョン 65 以降)、Chromium ベースのブラウザー、および Safari/iOS のフレームに読み込まれることにも注意してください。

srcDoc:

> src 属性をオーバーライドして、埋め込むインライン HTML。ブラウザーが srcdoc 属性をサポートしていない場合、ブラウザーは src 属性の URL にフォールバックします。

ということで、

HTMLかURLかの違いなのかしら。

`srcDoc`を使えば`const html = "<h1>Hi</h1>"`をそのiframeに埋め込むことができる。

`src`はURLを指定しなくてはならないので同一オリジンポリシーなどのセキュリティに気を配る必要がある


#### Middleground of solution for security by using srcDoc

`srcDoc`と`sandbox=""`の組み合わせで、iframe環境から親環境へアクセスを制限すしたままローカルで生成したHTMLをiframeへ出力させることができる

```TypeScript
// index.tsx
{
    // ...
  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe sandbox="" srcDoc={html}>
    </div>
  );
}

const html = `
<h1>Local HTML Doc</h1>
`;
```

#### ユーザ入力コードをsrcDocを用いて実行させる

- iframeはsrcDocでローカルで生成したHTMLを受け取る
- HTMLにはscriptタグで実行させたいJSコードをラッピングする
- JSコードはユーザ入力コードでこれを動的に更新する

```TypeScript
// index.tsx

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');

    //...

    // htmlはローカル生成して...
    // その中身はユーザ入力
  const html = `
  <script>${code}</script>
  `;

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
    //   srcDocで生成されたHTMLを取得する
      <iframe sandbox="" srcDoc={html}></iframe>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector('#root'));
```

これを実行するとエラーが表示される。

iframeにはscriptを介してJSコードを実行することは許可されていないというエラーである。

なのでiframeに許可を追加する。

```TypeScript
    // `allow-script`
    <iframe sandbox="allow-script" srcDoc={html}></iframe>
```

これで実行と埋め込みが実現できた。

#### Execute unescaped input code

現状、inframeの`srcDoc`属性に直接コードを渡しているので、

```html
<iframe srcDoc="
  <script>
    (() => {
      //...
    })()
  </script>
" />
```
というようになっている。

そんな中、

非常に大きな、多くのモジュールをバンドルしなくてはならなくなったとき。

`Uncaught SyntaxError: Invalid or unexpected token`というエラーに出くわすかも。

NOTE: やっぱり下記の内容は無視して

---

(入力されたモジュールが長すぎるとブラウザが勝手に中身を省略してダブルクオーテーションで内容を区切る場合があるためである。

つまり

```html
<iframe srcDoc="
  <script>
    (() => {
      // very very long module content...
    "<script>
    })()
  </script>
" />
```

上記のようにモジュールの省略された部分がダブルクオーテーションで区切られているために

srcDocの値を示すダブルクオーテーションと判断されて、

本来そのあとに続くモジュールの続きが、

無効な文字として処理されてしまったのである。

なぜそんなことが起こるのか？

理由はHTMLが文字列として渡されるからである。

```JavaScript
const html = `
  <script>
    ${code}
  </script>
`;

// If code is like this...
(() => {
  return "<script>{}</script>";
})();
```
```Html 
<iframe srcDoc="
  <script>
    (() => {
      return "<script>{}</script>";   <!-- ここのダブルクオーテーションまでがsrcDocの値だと判断されてしまう -->
    })();
  </script>
" />
```

---

#### iframe間通信

直接的な通信を制限してもフレーム間で間接的に通信する方法。

親環境にmessageイベントのイベントリスナを設けてmessageイベントを送信することでやり取りする方法をとる。

```TypeScript
// parent context
window.addEventListener('message', (event) => {
  console.log(event);
});

// iframe context
parent.postMessage("hello, parent");
```

submitして

```bash
MessageEvent {
  # ...
}
```

外部は親コンテキストの`addEventListener`にアクセスするのが困難なため安全な通信方法といえる。

さらにpostMessage()には受信先のオリジンを指定できるので受信相手を指定できる。

#### iframe間通信の導入

- refを使ってメッセージを受信するiframeを定める
- iframeの内容（テンプレート）を`html`で定め、そこにメッセージ受信用のaddEventListenerを設ける
- バンドル内容をref(が指しているiframe)へポストする

```TypeScript
// index.tsx


const App = () => {
  const ref = useRef<any>();
  const iframe = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    // setCode(result.outputFiles[0].text);

    // NOTE: setCodeで内容をページに表示する必要がなくなり、
    // 代わりに出力結果iframeへ出力させる
    // その方法は
    // refが指しているiframeへメッセージを投稿するという方法
    iframe.current.contentWindow.postMessage(result.outputFiles[0].text, "*");
  };

  // NOTE: htmlの内容をシンプルなHTMLにする
  // 
  // テンプレートとしてイベントリスナを設置することで
  // 常にポストされたメッセージを受信させる
  // （ひとまず）
  const html = `
    <html>
      <head></head>
      <body>
        <div id="root">
          <script>
            window.addEventListener('message', (e) => {
              console.log(e.data);
            }, false);
          </script>
        </div>
      </body>
    </html>
  `;

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      {/* NOTE: メッセージを受信するためにrefはここを指すようにする */}
      <iframe ref={iframe} sandbox="" srcDoc={html}></iframe>
    </div>
  );
};
```

検証:

ユーザ入力フォームに次を入力＆サブミット

```JavaScript
import ReactDOM from 'react-dom';

console.log(ReactDOM);
```

親環境コンテキストでconsole.logの出力内容を取得できた。

#### ユーザ入力内容の画面出力

iframeには`div#root`があるのでそこへreactを出力させてみる

```JavaScript
import ReactDOM from 'react-dom';

const App = () => {
  return <h1>Hi, there</h1>;
};

ReactDOM.render(<App />, document.querySelector('#root'));
```

submitしたらHi, thereがiframe画面に出力された！

これで入力内容を出力画面に出力することができるようになった。

## Highlightig error

要はテンプレートにエラーを補足する機能を設ければよい。

htmlテンプレートにtry...catch()を設ける

```JavaScript
  const html = `
    <html>
      <head></head>
      <body>
        <div id="root">
          <script>
            window.addEventListener('message', (e) => {
              try {
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

```

## iframeのリセット

ユーザがbodyを空にする処理を実行させた（submitした）後は、

正常に動作しなくなる。

```JavaScript
document.body.innerHTML = "";
```

上記を実行させるとそれいこうアプリケーションは動作しなくなる。

iframeのhtmlのbodyタグの中身が空になっったからである。

なのでsubmitされてからiframeの中身をリセットする機能を設ける必要がある。

```TypeScript
// index.js

  const onClick = async () => {
    if (!ref.current) {
      return;
    }
    // NOTE: サブミットされたら即座にhtmlをリセットさせる
    iframe.current.srcdoc = html;

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    // setCode(result.outputFiles[0].text);
    iframe.current.contentWindow.postMessage(result.outputFiles[0].text, '*');
  };
```