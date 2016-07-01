var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: [
        'babel-polyfill',
        'webpack-dev-server/client?http://0.0.0.0:8080' , // WebpackDevServer host and port
        'webpack/hot/only-dev-server',
        './demo/index.js'
    ],
    output: {
        path: "./dist",
        filename: 'app.js',
        sourceMapFilename: '[file].map',
    },
    module: {
        loaders: [
            {  
                test: /\.js$/, 
                exclude: /node_modules/, 
                loader: "babel-loader",
                query: {
                   presets: ['es2015', 'stage-1', 'react'],
                   plugins: ['transform-regenerator', "transform-decorators-legacy"]
                }
            },
            // { test: /\.(png|jpg|svg)$/, loader: 'url-loader?name=images/[name].[ext]&limit=100' }
        ]
    },
    plugins: [
        new ExtractTextPlugin("[name].css"),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.ProvidePlugin({
            "_": "lodash",
        })

    ]
};