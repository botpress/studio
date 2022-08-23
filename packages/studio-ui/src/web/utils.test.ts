import { recursiveSearch } from './util'

test('recursiveSearch', () => {
  const obj = {
    sub: {
      id: 1,
      type: 'image',
      micro: {
        name: 'test',
        type: 'node'
      }
    },
    id: 2,
    type: 'standard'
  }
  expect(recursiveSearch(obj, 'type')).toEqual(['image', 'node', 'standard'])
})
