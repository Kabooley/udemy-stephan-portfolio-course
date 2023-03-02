# Note: Section 19: Connecting Bundles in Redux

*BundlingプロセスはどのようにReducerに追加されるのだ？のような問いは、最終的にselectorを使うべきか使わざるべきかの議論になる。*

今２種類のプロパティをRedux stateは抱えている。

`data`とそれ以外である。

`data`はバンドリングプロセスの結果を保存するオブジェクトで、

今いくつのセルがあるのかに依存するプロパティでもある。

`bundles`は`{ [cell id]: Bundle }`を抱えることになるので

`bundles`は技術的に`cells`の派生stateになる、とのこと。



こんなときどうしたらbundlesはシンプルに設計できるか。

```TypeScript
// state/reducers/cellReducers.ts
interface CellsState {
  loading: boolean;
  error: string | null;
  order: string[];
  data: {
    [key: string]: Cell;
  };
}
```
案１ sekector (useSelector等のredux stateを取得、検索する仕組み)を使って見る方法：

非同期の計算を実現させるのが困難であるため使用しないほうがいい。

そもそもセレクタはパフォーマンスの向上のために同じ引数からなる計算はスキップされる可能性がある。

案２ selectorを使わない非同期処理を実装する方法

バンドルリクエストを送信して、バンドル結果を待ち、バンドル結果をRedux stateへ保存する方法



#### [自習]Redux Selector

https://redux.js.org/usage/deriving-data-selectors

- なぜ優れたReduxアーキテクチャはstateを最小に保ち、derived dataを導き出すのか
- セレクタ関数によるデータの導出とルックアップのカプセル化の原則
- Reselectライブラリを使って、最適化のためのメモ化セレクタを書く方法
- Reselectを使った上級テクニック
- セレクタを作成するためのツールやライブラリの追加
- セレクタの書き方のベストプラクティス

Reduxはstateを最小にとどめ、可能な限りそのstateから追加の値をを導き出すことを特に推奨しています。

Selectorとは：

**`selector`関数はRedux-stateを引数として受け付け、stateに基づくデータを返す関数のことである**

selectorとはReduxのstateからデータを取得する仕組みで、パフォーマンスが最適化されている。

なのでhooksの`useSelector`を必ずしも使う必要がなく、独自の関数を用意してもいい
