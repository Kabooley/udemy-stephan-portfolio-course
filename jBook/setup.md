# Note Set up React18 + webpack5 + TypeScript + @monaco-editor/react

+ webworkerといったところでしょうか。

環境セットアップのメモ。

どうせバンドリングしたかったので講義とは違い`create-react-app`なしで構築する

```bash
$ mkdir jBook
$ cd jBook
$ yarn init -y
$ yarn
$ yarn add webpack webpack-dev-server webpack-cli --dev
$ yarn add typescript ts-loader --dev
$ yarn add react react-dom @types/react @types/react-dom --dev
$ yarn add css-loader style-loader html-webpack-plugin --dev
$ yarn add babel-loader @babel/core @babel/preset-env @babel/preset-react --dev
$ touch webpack.config.js    # Generate webpack config file manually
$ npx tsx --init     # Generate tsconfig.json 

# Define each config file and mkdir src/ and dist/ 

NOTE: ここまで終わった

# Introduce each packages

# @monaco-edior/reactは
# TypeScriptの型情報が必要な場合、本家monaco-editorが必要である
# そのため先に本家をインストールする
$ yarn add monaco-editor
$ yarn add @monaco-editor/react

TODO: 続きを完了させること
```

TODO: my-jbookの削除！ストレージがいっぱいいっぱいになってきた！

## 参考