const { exec } = require('child_process')
// const core = require('@actions/core')
require('bluebird-global')

/**
 * Returns the latest release tag (ignore branches)
 */
const getLastTags = async () => {
  console.log('Getlast')

  const status = await Promise.fromCallback(cb => exec('git status', cb))
  console.log('status', status)
  const rawTags = await Promise.fromCallback(cb => exec('git rev-list --tags --max-count=20', cb))
  const tags = rawTags
    .trim()
    .split('\n')
    .join(' ')

  console.log('TAGS', rawTags, tags)

  const rawRevs = await Promise.fromCallback(cb => exec(`git describe --abbrev=0 --tags ${tags}`, cb))
  const revs = rawRevs.trim().split('\n')

  for (i = 0; i < revs.length; i++) {
    if (/^v\d/.test(revs[i])) {
      //core.setOutput('LAST_TAG', revs[i])
      console.log(revs[i])
      return revs[i]
    }
  }
}

getLastTags()