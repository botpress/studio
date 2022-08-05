import { ok, err, Result } from 'neverthrow'
import { VError } from 'verror'

const t = process.env.THROW

function d(): Result<string, 'err1' | 'err2'> {
  if (t) {
    return err('err1')
  } else {
    return ok('ok')
  }
}

function c() {
  // const r = d().match(
  //   (t) => {return 1},
  //   (e) => {return 2}
  // )

  // // r.match((t) => t, () => {}))
  // if (r.isErr()) {
  // } else {
  // }
  throw new VError('something')
}
function b() {
  c()
}
function a() {
  b()
}

a()
