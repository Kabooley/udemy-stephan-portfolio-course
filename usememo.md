# [公式] useMemo ノート

https://beta.reactjs.org/reference/react/useMemo

`useMemo`は再レンダリングする前後の計算結果をキャッシュしておける機能である。

## Reference

useMemo()はコンポーネントのトップレベルへ記述しましょう。

```JavaScript
import { useMemo } from 'react';

function TodoList({ todos, tab }) {
  const visibleTodos = useMemo(
    () => filterTodos(todos, tab),
    [todos, tab]
  );
  // ...
}
```

#### 引数

```TypeScript
React.useMemo<?>(
    calculateValue: ?
    dependencies: ?[]
)
```

- calculateValue: キャッシュしたい値を計算する関数

この関数は**純粋**で**引数をとらず**、任意の型の値を返す必要がある。

最初のレンダリング時にこの関数が呼び出され、

その後、

依存関係が最後のレンダリングから変更されていない場合、Reactは同じ値を返す。

そうでない場合は、calculateValue()を再度呼び出してその結果を返す。

NOTE: `pure function` 同じ引数を渡されたら同じ結果を返す関数のこと。

- dependencies: 依存関係。

calculateValueコードの内部で参照されるすべてのリアクティブな値のリストです。

リアクティブな値には、props、state、およびコンポーネント本体で直接宣言されたすべての変数と関数が含まれます。

#### 戻り値

初期レンダリング時：

calculateValue()の、引数なしでの計算結果を、useMemo()は返す。

それ以降：

（依存関係が変わっていなければ）前回のレンダリングで既に保存された値を返すか、

再度calculateValueを呼び出し、calculateValueが返した結果を返すかのどちらかになる。

#### Caveats

- `useMemo`はHookなのでコンポーネントのトップレベルでのみ呼び出すことができる。

条件分岐で発動する中き方はしてはならない。

- Strictモードでは、ReactはuseMemo()の計算関数を毎度二度呼び出す。

これは開発中のアプリケーションでは通常の動作で、アプリケーションの動作に影響はしない

- Reactは特別そうしない限りはキャッシュした値をどこかへスローしたりしない

## Usage

具体的に。

毎レンダリングのたびに再計算が高くつくような計算をスキップするのに役立つ。

```JavaScript
import { useMemo } from 'react';

function TodoList({ todos, tab, theme }) {
  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
  // ...
}
```

1. 初期レンダリング時

useMemo()は第一引数の計算結果をそのまま返す。

なので`visibleTodos`は`filterTodos`の計算結果がそのまま代入される。

2. それ以降のレンダリングが発生したとき

依存関係配列にある変数(`todos`, `tab`)を、前回レンダリング時とその値に変更がないか比較して、

変更なし：すでに計算済の結果を返す。

変更あり：useMemoの第一引数の関数を再度実行させてその計算結果を返す

#### 注意

`useMemo`はパフォーマンスの最適化という目的のためだけに使用するべきである。

それ以外の理由で使用している場合はほかの解決策を見つけようとのこと。

## どうやって再計算が高くつくのか判断するの？

一般的には、

数千もオブジェクトを作ったりループしたりするのでなければ「高くつく」という判断にはならない。

もしも確信が持てないならな、時間を測定して判断するとよい。

```JavaScript
// こんな感じ
console.time('filter array');
const visibleTodos = filterTodos(todos, tab);
console.timeEnd('filter array');
```

また敢えてChromeのCPUスロットをいじってわざと計算速度を遅くすることで、遅いマシンを持つユーザの場合に対応できるかも。

あと開発中モードだと、先に述べたようにReactを毎度二回レンダリングするため、

プロダクトモードにしてから時間を計測するのがいいでしょう。

## `useMemo`を使う場合と直接値を計算する処理を実行する場合どれくらい違うか

useMemo()に軍配。



## Componentの再レンダリングをスキップさせる

通常、Reactはそのコンポーネントを再レンダリングすることにしたら、

そのコンポーネントの子コンポーネントすべては再帰的に再レンダリングすることになる。

もしこの時、再レンダリングに時間がかかるコンポーネントの存在を確認できたとしたら、useMemoの出番かもしれない。

例えばその時間のかかるコンポーネントにある一つのpropを渡しているようなときは、

そのpropをメモすればそのpropしか受け取らないコンポーネントは再レンダリングをスキップさせることができる

```JavaScript
export default function TodoList({ todos, tab, theme }) {
  // ...
  return (
    <div className={theme}>
      <List items={visibleTodos} />
    </div>
  );
}

// List.js
// 
// memo: https://beta.reactjs.org/reference/react/memo
// propが変更なしなら再レンダリングをスキップする機能
import { memo } from 'react';

const List = memo(function List({ items }) {
  // ...
});
```
