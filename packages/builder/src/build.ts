import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import rimraf from 'rimraf'
import * as ts from 'typescript'

import { error, normal } from './log'
import { build as webpackBuild } from './webpack'

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  await buildBackend(modulePath)
  await webpackBuild(modulePath)

  normal('Build completed')
}

export async function buildBackend(modulePath: string) {
  rimraf.sync(path.join(modulePath, 'dist'))
  const start = Date.now()

  const tsConfigFile = ts.findConfigFile(modulePath, ts.sys.fileExists, 'tsconfig.json')
  const skipCheck = process.argv.find((x) => x.toLowerCase() === '--skip-check')

  // By default you don't want it to fail when watching, hence the flag
  const failOnError = process.argv.find((x) => x.toLowerCase() === '--fail-on-error')

  let validCode = true
  if (!skipCheck && tsConfigFile) {
    validCode = runTypeChecker(modulePath)
  }

  if (validCode) {
    await moveFiles(modulePath)

    normal(`Generated backend (${Date.now() - start} ms)`, path.basename(modulePath))
  } else if (failOnError) {
    process.exit(1)
  }
}

const moveFiles = async (modulePath: string) => {
  const filesToMove = [
    { src: path.resolve(modulePath, 'src/translations'), dest: path.resolve(modulePath, 'dist/ui/translations') }
  ]

  for (const file of filesToMove) {
    if (await fse.pathExists(file.src)) {
      await fse.copySync(file.src, file.dest)
    }
  }
}

const getTsConfig = (rootFolder: string): ts.ParsedCommandLine => {
  const parseConfigHost: ts.ParseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true
  }

  const configFileName = ts.findConfigFile(rootFolder, ts.sys.fileExists, 'tsconfig.json')
  const { config } = ts.readConfigFile(configFileName!, ts.sys.readFile)

  // These 3 objects are identical for all modules, but can't be in tsconfig.shared because the root folder is not processed correctly
  const fixedModuleConfig = {
    ...config,
    compilerOptions: {
      ...config.compilerOptions,
      outDir: path.resolve(`${rootFolder}/dist`)
    },
    exclude: ['**/*.test.ts', './src/ui/**', '**/node_modules/**'],
    include: ['../../studio-be/src/typings/*.d.ts', '**/*.ts']
  }

  return ts.parseJsonConfigFileContent(fixedModuleConfig, parseConfigHost, rootFolder)
}

const runTypeChecker = (rootFolder: string): boolean => {
  const { options, fileNames } = getTsConfig(rootFolder)

  const program = ts.createProgram(fileNames, options)
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(program.emit().diagnostics)

  for (const { file, start, messageText, code } of diagnostics) {
    if (file) {
      const { line, character } = file.getLineAndCharacterOfPosition(start!)
      const message = ts.flattenDiagnosticMessageText(messageText, '\n')

      error(
        chalk.bold(
          `[ERROR] in ${chalk.cyan(file.fileName)} (${line + 1},${character + 1})
                 TS${code}: ${message}
                 `
        )
      )
    } else {
      error(ts.flattenDiagnosticMessageText(messageText, '\n'))
    }
  }

  return !diagnostics.length
}
