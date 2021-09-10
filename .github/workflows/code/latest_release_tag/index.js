const { exec } = require('child_process')
const core = require('@actions/core')

const getLastTags = async () => {
  core.setOutput('test', 'bla')
  exec('git rev-list --tags --max-count=20', (err, rawTags, stderr) => {
    const tags = rawTags
      .trim()
      .split('\n')
      .join(' ')

    exec(`git describe --abbrev=0 --tags ${tags}`, (err, rawRevs, stderr) => {
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
}

getLastTags()
