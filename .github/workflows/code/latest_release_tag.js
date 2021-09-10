const { exec } = require('child_process')

/**
 * Returns the latest release tag (ignore branches)
 */
const getLastTags = async () => {
  exec('git rev-list --tags --max-count=20', (err, revsList, stderr) => {
    const revisions = revsList.trim().split('\n')

    exec(`git describe --abbrev=0 --tags ${revisions.join(' ')}`, (err, result) => {
      const tags = result.trim().split('\n')

      for (i = 0; i < revisions.length; i++) {
        if (/^v\d/.test(tags[i])) {
          console.log(`::set-output name=tag::${tags[i]}`)
          return
        }
      }
    })
  })
}

getLastTags()
