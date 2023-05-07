const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		index: './src/index.tsx',
		bundleWorker: './src/worker/bundle.worker.ts',
		jsxHighlightWorker: './src/worker/jsx-highlight.worker.ts'
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
	/**
	 * https://webpack.js.org/guides/output-management/#setting-up-htmlwebpackplugin
	 * 
	 * */ 
	plugins: [
		new HtmlWebPackPlugin({
			template: "./src/index.html"
		})
	],
	devtool: 'inline-source-map',
	devServer: {
		static: './dist',
	},
	/**
	 * https://webpack.js.org/guides/code-splitting/#splitchunksplugin
	 * */ 
	optimization: {
		runtimeChunk: 'single'
	}
};
