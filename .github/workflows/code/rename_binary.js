const fs = require('fs')
const path = require('path')

const sanitizeBranchName = input => {
  const regex = {
    illegalFile: /[\/\?<>\\:\*\|"]/g,
    control: /[\x00-\x1f\x80-\x9f]/g
  }

  return input
    .replace('refs/heads/', '')
    .replace(/\.|\//gi, '_')
    .replace(regex.control, '')
    .replace(regex.illegalFile, '')
}

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
