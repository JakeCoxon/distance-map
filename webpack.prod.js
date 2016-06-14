var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: [
        './src/js/index.js'
    ],
    output: {
        path: require("path").resolve("./dist"),
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
                   plugins: []
                }
            },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            // { test: /\.(png|jpg|svg)$/, loader: 'url-loader?name=images/[name].[ext]&limit=100' }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({minimize: true}),
        new ExtractTextPlugin("[name].css"),
        new webpack.NoErrorsPlugin()

    ]
};