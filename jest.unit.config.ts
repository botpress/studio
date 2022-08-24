import type { Config } from '@jest/types'
import { defaults as tsjPreset } from 'ts-jest/presets'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  projects: [
    {
      rootDir: 'packages/studio-be/src',
      testMatch: ['<rootDir>/**/*.test.ts'],
      displayName: { name: 'backend', color: 'red' },
      testEnvironment: 'node',
      transform: {
        ...tsjPreset.transform
      },
      clearMocks: true
    },
    {
      rootDir: 'packages/studio-ui/src/web',
      testMatch: ['<rootDir>/**/*.test.ts'],
      displayName: { name: 'ui', color: 'blue' },
      testEnvironment: 'jsdom',
      transform: {
        ...tsjPreset.transform
      },
      clearMocks: true
    }
  ]
}

export default config
