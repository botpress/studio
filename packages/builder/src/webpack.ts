import _ from 'lodash'
import path from 'path'
import webpack from 'webpack'
import { error, normal } from './log'

const libraryTarget = mod => `botpress = typeof botpress === "object" ? botpress : {}; botpress["${mod}"]`

export function config(projectPath) {
  const packageJson = require(path.join(projectPath, 'package.json'))

  const full: webpack.Configuration = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
    entry: [`./src/ui/index.tsx`],
    output: {
      path: path.resolve(projectPath, './dist/ui'),
      publicPath: '/js/modules/',
      filename: 'view.bundle.js',
      libraryTarget: 'assign',
      library: libraryTarget(packageJson.name)
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    },
    resolveLoader: {
      modules: [path.resolve(__dirname, '../node_modules'), 'node_modules']
    },
    resolve: {
      alias: {
        common: path.resolve(__dirname, '../../studio-be/dist/common')
      },
      modules: ['node_modules', path.resolve(__dirname, '../../ui-shared/node_modules')],
      extensions: ['.js', '.jsx', '.tsx', '.ts']
    },
    module: {
      rules: [
        {
          test: /\.t?sx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-modules-typescript-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: `${packageJson.name}__[name]__[local]___[hash:base64:5]`
              }
            },
            { loader: 'sass-loader' }
          ]
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
        },
        {
          test: /font.*\.(woff|woff2|svg|eot|ttf)$/,
          use: { loader: 'file-loader', options: { name: '../fonts/[name].[ext]' } }
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: [{ loader: 'file-loader', options: { name: '[name].[hash].[ext]' } }]
        }
      ]
    }
  }

  return [full]
}

function writeStats(err, stats, exitOnError = true, callback?, moduleName?: string) {
  if (err || stats.hasErrors()) {
    error(stats.toString('minimal'), moduleName)

    if (exitOnError) {
      return process.exit(1)
    }
  }

  for (const child of stats.toJson().children) {
    normal(`Generated frontend bundle (${child.time} ms)`, moduleName)
  }

  callback?.()
}

export function watch(projectPath: string) {
  const confs = config(projectPath)
  const compiler = webpack(confs)
  compiler.watch({}, (err, stats) => writeStats(err, stats, false, undefined, path.basename(projectPath)))
}

export async function build(projectPath: string): Promise<void> {
  const confs = config(projectPath)

  await new Promise(resolve => {
    webpack(confs, (err, stats) => writeStats(err, stats, true, resolve, path.basename(projectPath)))
  })
}
