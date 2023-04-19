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

## webpack + webworker Tips

webpack5だと自動的にwebworkerのファイルを切り出してくれる。

現在の設定：

特にwebworkerに対する特別な設定を設けていない

```JavaScript
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		index: './src/index.tsx',
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	  },
	output: {
		globalObject: 'self',
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			}
		]
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: "./src/index.html"
		})
	],
	devtool: 'inline-source-map',
	devServer: {
		static: './dist',
	},
	optimization: {
		runtimeChunk: 'single'
	}
};
```

src/:

```bash
# Each dir owns some files
src/
    |- bundler/
    |- components/
    |- constants/
    |- Layout/
    |- Sections/
    |- storage/
    |- worker/
            |- eslint.worker.ts
            |- jsx-highlight.worker.ts
    |- index.tsx
    |- index.html
```
出力結果：

```bash
dist/ 
    |- index.bundle.js
    |- index.html
    |- runtime.bundle.js
    |- src_worker_eslint_worker_ts.bundle.js
    |- src_worker_jsx_highlight_worker_ts.bundle.js
```

各ファイルはすべてindex.bundle.jsへバンドルされているけれど、

`xxx.worker.ts`はすべて別のファイルとして切り出されている。

なので自動的にworkerであることを認識して切り分けてくれているのだと思う。


## 参考