const path = require('path')
const fse = require('fs-extra')

const create = async () => {
  const args = require('yargs')(process.argv).argv
  if (!args.name) {
    console.error('Component name is required (set with --name parameter')
    console.error('Example: yarn cmd component:create --name my-component-name')
    return cb()
  }

  const blankDir = path.join(__dirname, `../packages/components/blank`)
  const componentDir = path.join(__dirname, `../packages/components/${args.name}`)
  if (await fse.pathExists(componentDir)) {
    console.error('A component with that name already exists.')
    return
  }

  fse.copySync(blankDir, componentDir)

  const packageJsonPath = path.join(componentDir, 'package.json')
  const packageJson = fse.readJsonSync(packageJsonPath)
  fse.writeJSONSync(packageJsonPath, { name: args.name, ...packageJson }, { spaces: 2 })

  try {
    const schema = path.join(componentDir, 'src/backend/schema.ts')

    const schemaContent = fse.readFileSync(schema, 'utf-8').toString()
    fse.writeFileSync(schema, schemaContent.replace('COMPONENT_NAME', args.name))
  } catch (err) {
    console.error(`Couldn't edit schema ${err}`)
  }

  console.log(`
Component created successfully! 

1. Switch to directory ${componentDir}
2. Type 'yarn build'
3. Type 'yarn package'
4. Import the generated .tgz file in your bot using the code editor
 `)
}

module.exports = { create }
