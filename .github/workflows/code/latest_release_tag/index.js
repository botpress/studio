const { exec } = require('child_process')
const core = require('@actions/core')

console.log('gettags')
core.setOutput('test', 'bla')

exec('git rev-list --tags --max-count=20', (err, rawTags, stderr) => {
  console.log('list', rawTags)
  console.log(`::set-output name=bla::hello`)
  core.setOutput('test2', 'blab')

  if (err) {
    console.log('err rev', stderr)
    process.exit(1)
  }

  const tags = rawTags
    .trim()
    .split('\n')
    .join(' ')

  exec(`git describe --abbrev=0 --tags ${tags}`, (err, rawRevs, stderr) => {
    if (err) {
      console.log('err desc', stderr)
      process.exit(1)
    }

    console.log('revs', rawRevs)
    const revs = rawRevs.trim().split('\n')

    for (i = 0; i < revs.length; i++) {
      if (/^v\d/.test(revs[i])) {
        core.setOutput('tag', revs[i])
        console.log(revs[i])
        return revs[i]
      }
    }
  })
})
