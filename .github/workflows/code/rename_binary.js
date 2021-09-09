const fs = require('fs')
const path = require('path')

const sanitizeBranchName = input => input.replace(/[\W_]+/g, '_')

const rename = () => {
  const githubEvent = JSON.parse(process.env.GITHUB_EVENT)
  const branchName = sanitizeBranchName(githubEvent.ref)

  for (const fileName of fs.readdirSync('./bin')) {
    const [name, _version, platform, arch] = fileName.split('-')
    const newName = `${name}-${branchName}-${platform}-${arch}`

    fs.renameSync(path.join('./bin', fileName), path.join('./bin', newName))
  }
}

rename()
