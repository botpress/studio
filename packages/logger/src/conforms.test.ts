import { conforms } from './transports/console'

test('rule conform should work', () => {
  // arrange
  const rule = 'training:svm'

  const tests = [
    { ns: 'training', success: false },
    { ns: 'training:stuff', success: false },
    { ns: 'training:svm', success: true },
    { ns: 'training:svm:stuff', success: true },
    { ns: 'training:svm:stuff:stuff-again', success: true },
    { ns: '', success: false }
  ]

  for (const test of tests) {
    // act
    const actual = conforms(test.ns, rule, ':')
    const expected = test.success

    // assert
    expect(actual).toBe(expected)
  }
})

test('empty rule should apply to everything', () => {
  // arrange
  const rule = ''

  const tests = [
    { ns: 'training', success: true },
    { ns: 'training:stuff', success: true },
    { ns: 'training:svm', success: true },
    { ns: 'training:svm:stuff', success: true },
    { ns: 'training:svm:stuff:stuff-again', success: true },
    { ns: '', success: true }
  ]

  for (const test of tests) {
    // act
    const actual = conforms(test.ns, rule, ':')
    const expected = test.success

    // assert
    expect(actual).toBe(expected)
  }
})
