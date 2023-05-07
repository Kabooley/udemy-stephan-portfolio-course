# React App パフォーマンス最適化

TODO: 暇なときに記事をまとめる。

## 参考

https://legacy.reactjs.org/docs/perf.html

https://legacy.reactjs.org/docs/optimizing-performance.html

https://react.dev/reference/react/Profiler

## 計測方法


## メモ

#### Optimizing performance

https://react.dev/learn/render-and-commit#optimizing-performance

> 更新されたコンポーネントがツリーの非常に高い位置にある場合、更新されたコンポーネント内にネストされたすべてのコンポーネントをレンダリングするデフォルトの動作は、パフォーマンスにとって最適ではありません。パフォーマンスの問題が発生した場合は、パフォーマンス セクションで説明されている解決方法がいくつかあります。時期尚早に最適化しないでください。

高階層のコンポーネントの再レンダリングで、すべての子コンポーネントの再レンダリングを起こすのは高コストであるので、

子コンポーネントの再レンダリングが常に行われるべきかを考慮し制御しなくてはならない。

#### Optimizing performance (old docs)

https://legacy.reactjs.org/docs/optimizing-performance.html

- bundlerを使ってファイルを圧縮する
- production buildを使う

- Profiling Components with the DevTools Profiler

#### `<Profiler>`

> `<Profiler>`はReactアプリケーションのレンダリング・パフォーマンスの計測をプログラマティックに可能にしてくれます。

