## [公式] 副作用と同期をとる方法

https://beta.reactjs.org/learn/synchronizing-with-effects

のノート。`useEffect()`についてわかろうという内容。

What you will learn:

- 副作用とは
- 副作用はイベントとどう違うのか
- 副作用はどのように宣言すればいいのか  省略
- どのように不要な副作用の反応を抑えればいいのか
- どうして副作用は開発モードだと二度実行されるのか

#### イベントと異なる部分

２つのReactコンポーネントの内部のロジック：

- `Rendering Code`は純粋でなければならない
- イベントハンドラを抱える場合があり、イベントハンドラは副作用（プログラムの状態を変化させる事象）をもたらす

`Effects`は

- プログラマが指定するレンダリングによって引き起こされる副作用のこと
- 特定のイベントから発生するものではないものでもある。
- レンダリングプロセスの後に実行される

NOTE: これ以降`Effect`はuseEffectのようなReact上での副作用を指し、`side-effect`は広義の副作用を意味するという使い分けをする

#### 貴方は副作用が必要ないかもしれない

`useEffect`等の副作用をもたらす機能は貴方にとってそもそも不要かもしれない。

それ等副作用は**アプリケーションの外部と通信するための手段**として使うべきで、

stateの変更を「stateに基づいて」行うような変更は`useEffect()`を使って実施するべきでない。

参考にしろと：

https://beta.reactjs.org/learn/you-might-not-need-an-effect

#### How to skip unnecessary re-running useEffect()

`useEffect()`の第二引数の依存関係配列に反応させたい変数を含めるなどする。

講義でも扱った警告：

```
Lint Error
14:6 - React Hook useEffect has a missing dependency: 'isPlaying'. Either include it or remove the dependency array.
```
以下のコードで発生：

```JavaScript
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    // NOTE: isPlaying を使ているが
    if (isPlaying) {
      console.log('Calling video.play()');
      ref.current.play();
    } else {
      console.log('Calling video.pause()');
      ref.current.pause();
    }
    // NOTE:依存配列に含めていない
  }, []); // This causes an error

  return <video ref={ref} src={src} loop playsInline />;
}
```

原因：

副作用の内容は`isPlaying`に依存しているにもかかわらず、useEffect()は依存配列に`isPlaying`を含めていないから

解決方法：

`isPlaying`を依存配列に含めること

依存配列に含まれる変数の何を比較しているのか：

その変数が、前回の値と全く同じだった場合にのみReactは再レンダリングをスキップする。

比較方法は`Object.is()`を使って比較するとのこと。

依存関係は選択することはできない。

#### `useEffect`の実行タイミング：`mount`, `unmount`時とは？

通常`useEffect()`の依存配列を空に指定すれば、副作用は「マウント」時に一度だけ実行されるだけになる。

今次のコードを実行したら、`Connecting`の出力は一度しか起こらないはず。

なぜなら依存配列は空でそうなると副作用はマウント時にのみ実行されるだけになるはずだからである。

```JavaScript
// index.js
import { useEffect } from 'react';
import { createConnection } from './chat.js';

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
  }, []);
  return <h1>Welcome to the chat!</h1>;
}

// Chat.js
export function createConnection() {
  // A real implementation would actually connect to the server
  return {
    connect() {
      console.log('✅ Connecting...');
    },
    disconnect() {
      console.log('❌ Disconnected.');
    }
  };
}
```
```bash
Connecting...
Connecting...
```

しかし2度出力された。なぜ？

要は、マウント時に実行はしたけどアンマウントのことを考えていなかったということである。

> ChatRoomコンポーネントは、多くの異なる画面を持つ大規模なアプリの一部であると想像してください。ユーザーはChatRoomページで旅を開始します。コンポーネントがマウントされ、connection.connect()が呼び出されます。次に、ユーザが別の画面（例えば、設定ページ）に移動したとします。ChatRoomコンポーネントはアンマウントされます。最後に、ユーザーが「戻る」をクリックすると、ChatRoomは再びマウントされます。この時、2つ目の接続が設定されますが、1つ目の接続は破棄されることはありません。このように、ユーザーがアプリ内を移動すると、接続はどんどん増えていきます。

> このようなバグは、大規模な手動テストを行わないと見逃しがちです。このようなバグを素早く発見するために、開発中のReactでは、すべてのコンポーネントを最初にマウントした直後に一度だけ再マウントします。接続中...」というログを2回見ることで、コンポーネントがアンマウントされたときにコードが接続を閉じていない、という本当の問題に気づくことができます。

解決策：アンマウント処理を忘れずに設けること。

```JavaScript
 useEffect(() => {
    const connection = createConnection();
    connection.connect();
    // NOTE: Cleanup function
    return () => {
      connection.disconnect();
    };
  }, []);
```

アンマウント処理はいつ実行されるの？

> クリーナップ関数は次回`useEffect()`が呼び出される前と、コンポーネントがアンマウントされるときに呼び出される。

#### どうやって二度発火する副作用を制御すればいいのか

> React は開発中のコンポーネントを意図的に再マウントし、最後の例のようにバグを見つけやすくします。正しい質問は、「一度エフェクトを実行する方法」ではなく、「再マウント後にエフェクトが機能するように修正する方法」です。

普通なら、その答えはクリーンアップ関数を実装することであるといえる。

ほとんどの副作用は下記の通りのパターンに従う。

NOTE:　以下はもう不要だと思ったので省略