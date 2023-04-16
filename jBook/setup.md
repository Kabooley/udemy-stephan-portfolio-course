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

# Introduce each packages

# es-build
# https://esbuild.github.io/getting-started/#wasm
$ yarnd add esbuild-wasm

# @monaco-edior/reactは
# TypeScriptの型情報が必要な場合、本家monaco-editorが必要である
# そのため先に本家をインストールする
$ yarn add monaco-editor
$ yarn add @monaco-editor/react
# 
# axios
# prettier @types/prettier
# localforage
# eslint
```



TODO: my-jbookの削除！ストレージがいっぱいいっぱいになってきた！

## React + Webpackの時の注意

アプリケーションを`create-react-app`で作成しないで、Reactは一つのパッケージとして取り込んだだけである。

そのためこの環境では`create-react-app`の時と異なり、

元となるhtmlファイルが定義されてあるpublic/は存在しない。

`index.html`はどこに定義しておけばいいのか。

また、

Reactでは、index.jsに必ずJSXを挿入する元となるDOMを指定しないといけないので

HTMLにはその元となるDOMが存在していないといけない。

ということで、

- index.htmlをあらかじめ用意しておく
- html-webpack-pluginにはどのhtmlファイルを参照するのかを教える

```html 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= htmlWebpackPlugin.options.title %></title>
</head>
<body>
    <!-- NOTE: #rootがReactのルートファイルに必要である -->
    <div id="root"></div>
</body>
</html>
```

```JavaScript
plugins: [
		new HtmlWebPackPlugin({
            // NOTE: これで元となるhtmlファイルを指定すればよい
			template: "./src/index.html"
		})
	],
```

こうすればわざわざpublicフォルダを作る必要がない。

出力結果：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
<script defer src="runtime.bundle.js"></script><script defer src="index.bundle.js"></script></head>
<body>
    <!-- ちゃんとdiv#rootが入っている -->
    <div id="root"></div>
</body>
</html>
```
## 参考