const { exec } = require('child_process')
require('bluebird-global')

const getLastTags = async () => {
  const rawTags = await Promise.fromCallback(cb => exec('git rev-list --tags --max-count=30', cb))
  const tags = rawTags
    .trim()
    .split('\n')
    .join(' ')

  const rawRevs = await Promise.fromCallback(cb => exec(`git describe --abbrev=0 --tags ${tags}`, cb))
  const revs = rawRevs.trim().split('\n')

  for (i = 0; i < revs.length; i++) {
    if (/^v\d/.test(revs[i])) {
      console.log(`::set-output name=tag::${revs[i]}`)
      return
    }
  }
}

getLastTags()
