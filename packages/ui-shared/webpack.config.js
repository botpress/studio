process.traceDeprecation = true

const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const moment = require('moment')

const isProduction = process.env.NODE_ENV === 'production'
const isWatching = process.argv.indexOf('--watch') !== -1

const config = {
  cache: false,
  mode: isProduction ? 'production' : 'development',
  bail: true,
  devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
  entry: ['./src/index.tsx'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
    alias: {
      '~': path.resolve(__dirname, './src'),
      common: path.resolve(__dirname, '../studio-be/out/common')
    }
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-bootstrap': 'ReactBootstrap',
    '@blueprintjs/core': 'BlueprintJsCore',
    '@blueprintjs/select': 'BlueprintJsSelect'
  },
  plugins: [],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-modules-typescript-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              url: false,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              options: {}
            }
          },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.css$/,
        exclude: /node_modules\/(?!@yaireo).*/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
}

if (process.argv.find(x => x.toLowerCase() === '--analyze')) {
  config.plugins.push(new BundleAnalyzerPlugin())
}

// We don't clean the dist folder when watching because all watchers starts at the same time
if (!isWatching) {
  config.plugins.push(
    new FileManagerPlugin({
      onStart: {
        delete: ['dist']
      }
    })
  )
}

const compiler = webpack(config)

compiler.hooks.done.tap('ExitCodePlugin', stats => {
  const errors = stats.compilation.errors
  if (errors && errors.length && process.argv.indexOf('--watch') === -1) {
    for (const e of errors) {
      console.error(e.message)
    }
    console.error('Webpack build failed')
    process.exit(1)
  }
})

const postProcess = (err, stats) => {
  if (err) {
    throw err
  }

  console.log(`[${moment().format('HH:mm:ss')}] Shared ${chalk.grey(stats.toString('minimal'))}`)
}
if (process.argv.indexOf('--compile') !== -1) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(
    {
      ignored: ['*', /!.\/src/]
    },
    postProcess
  )
}

module.exports = { web: config }
