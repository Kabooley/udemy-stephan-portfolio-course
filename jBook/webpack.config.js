const path = require('path');
const HtmlWebPackahePlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
        // NOTE: いまんとこひとまず
		index: './src/index.tsx',
		worker: './src/worker/index.ts'
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
		new HtmlWebPackahePlugin({
			title: 'Output Management'
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
