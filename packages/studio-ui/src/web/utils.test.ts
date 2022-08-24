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
  expect(recursiveSearch(obj, 'other')).toEqual([])
  expect(recursiveSearch({}, 'type')).toEqual([])
  expect(recursiveSearch([], 'type')).toEqual([])
  expect(recursiveSearch(null, 'type')).toEqual([])
  expect(recursiveSearch(undefined, 'type')).toEqual([])
  expect(recursiveSearch('string', 'type')).toEqual([])
  expect(recursiveSearch(1, 'type')).toEqual([])
  expect(recursiveSearch(obj, '')).toEqual([])
})
