const path = require('path');
module.exports = {
    entry: './src/demo.ts',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist'
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            include: path.resolve(__dirname, 'src'),
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'development'
};