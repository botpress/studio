export interface Package {
  name: string
  scripts: { [scriptName: string]: string }
  dependencies: { [scriptName: string]: string }
  bundledDependencies: string[]
}

// Taken from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const versionRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

const scriptsToDisable = ['publish', 'prepublish', 'postpublish']

export const validateNameVersion = ({ name, version }: { name: string; version?: string }) => {
  const nameValid = name && packageNameRegex.test(name)
  const versionValid = !version || (version && versionRegex.test(version.replace('^', ''))) || version.startsWith('git')

  if (!nameValid) {
    throw new Error(`Library name is invalid: ${name}`)
  } else if (!versionValid) {
    throw new Error(`Library version is invalid: ${version}`)
  }

  return { name, version }
}

export const disableScripts = (pkg: Package) => {
  if (!pkg.scripts) {
    return
  }

  scriptsToDisable.forEach((script) => {
    if (pkg.scripts[script]) {
      pkg.scripts[`_${script}`] = pkg.scripts[script]
      delete pkg.scripts[script]
    }
  })
}

export const addBundledDeps = (pkg: Package) => {
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies)
  }
}
