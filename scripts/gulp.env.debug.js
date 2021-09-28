const fs = require('fs')
const minimist = require('minimist')

const DEFAULT_BP_PATH = '$YOUR_BP_PATH'
const DEFAULT_ENV_VALUE = `
# use this env file to modify env variables for debug purposes (see launch.json for more details)

BP_DATA_FOLDER=${DEFAULT_BP_PATH}/packages/bp/dist/data
BP_MODULES_PATH=${DEFAULT_BP_PATH}/modules
NLU_ENDPOINT=http://localhost:3200
STUDIO_PORT=4000
`

const createEmptyEnvFileForDebugging = cb => {
  const { location } = minimist(process.argv.slice(2))
  if (!location) {
    return cb(
      new Error(
        'Creating empty env file for debugging requires a the desired file location as 1st positional parameter.'
      )
    )
  }

  if (fs.existsSync(location)) {
    return cb()
  }

  fs.writeFileSync(location, DEFAULT_ENV_VALUE)
  return cb()
}

module.exports = {
  createEmptyEnvFileForDebugging
}
