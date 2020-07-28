const InjectPlugin = require('webpack-inject-plugin').default;

module.exports = (env = {}) => {
  return {
    entry: './repl/src/repl.ts',
    output: {
      filename: 'repl/dist/repl-bundle.js',
      chunkFilename: 'repl/dist/[name].js',
      path: __dirname,
      publicPath: "/"
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            } 
          },
          {
            test: /\.css$/,
            use: ['to-string-loader', 'css-loader'],
          },
          {
            test: /\.(png|jpg|svg|jpeg|gif)$/,
            loader: 'url-loader'
          }
        ]
      },
  }
};
