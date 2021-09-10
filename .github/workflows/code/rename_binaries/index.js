const fs = require('fs')
const path = require('path')

const sanitizeBranchName = input => input.replace('refs/heads/', '').replace(/[\W_]+/g, '_')

const BIN_PATH = process.env.INPUT_PATH
const githubEvent = JSON.parse(process.env.GITHUB_EVENT)
const branchName = sanitizeBranchName(githubEvent.ref)

console.log(BIN_PATH, branchName)
for (const fileName of fs.readdirSync(BIN_PATH)) {
  const [name, _version, platform, arch] = fileName.split('-')
  const newName = `${name}-${branchName}-${platform}-${arch}`

  fs.renameSync(path.join(BIN_PATH, fileName), path.join(BIN_PATH, newName))
}
