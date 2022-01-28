import React from 'react'
import ReactDOM from 'react-dom'
import { SuperInput } from '../src'
import { SI_TYPES } from '../src/types'
import { data } from './data'

const code0 = 'event.state.user ? "yes" : "sorry unknown user" || true'
const code1 =
  'this is: {{event.state.user.language}} text in between {{ _.add(9, 10) }} else if keywords {{ user.language }}'
const code2 = 'this is for: {{user.timezone}} is the time zone sir and {{user.language}} is the language!'
const code3 = `I wish you a very happy new year and happy {{ state.session.usename }} birthday!

Math function: {{ Math.round(session.slots.device.confidence) }}
Timezone: {{user.timezone}}
Object Demo: {{ Object.keys({hello: "world"}) }}

This is the end.`

const msgs = {
  noGlobsEvalMsg: 'no globs'
}

const globs = {
  event: data,
  ...data,
  ...data.state
}

function App() {
  return (
    <div className="appContainer">
      <div className="wrapper">
        <h1>Superinput Inspector</h1>
        <section>
          <h2>expression</h2>
          <SuperInput type={SI_TYPES.EXPRESSION} value={code0} globs={globs} {...msgs} />
        </section>
        <section>
          <h2>expression (no globs)</h2>
          <SuperInput type={SI_TYPES.EXPRESSION} value={code0} {...msgs} />
        </section>
        <section>
          <h2>Valid</h2>
          <SuperInput value={code1} globs={globs} {...msgs} autoFocus />
        </section>
        <section>
          <h2>Invalid</h2>
          <SuperInput value={code2} globs={globs} {...msgs} />
        </section>
        <section>
          <h2>Something Else (no globs)</h2>
          <SuperInput value={code3} />
        </section>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
