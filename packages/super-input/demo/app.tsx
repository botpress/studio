import React from 'react'
import ReactDOM from 'react-dom'
import { SiTemplate } from '../src'
import { data } from './data'

function App() {
  return (
    <div className="appContainer">
      <div className="wrapper">
        <h1>Superinput Inspector</h1>
        <section>
          <h2>Valid</h2>
          <SiTemplate value={code1} maxHeight="100px" globs={globs} {...msgs} />
        </section>
        <section>
          <h2>Invalid</h2>
          <SiTemplate value={code2} maxHeight="100px" globs={globs} {...msgs} />
        </section>
        <section>
          <h2>Something Else</h2>
          <SiTemplate value={code3} maxHeight="300px" {...msgs} />
        </section>
      </div>
    </div>
  )
}

const code1 = '{{event.state.user.language}} text in between {{ _.add(9, 10) }} else if keywords {{ user.language }}'
const code2 = '{{user.timezone}} is the time zone sir and {{user.language}} is the language!'
const code3 = `I wish you a very happy new year and happy {{ state.session.usename }} birthday!

Math function: {{ Math.round(session.slots.device.confidence) }}
Timezone: {{user.timezone}}
Object Demo: {{ Object.keys({hello: "world"}) }}

This is the end.`

const msgs = {
  invalEvalMsg: 'invalid msg',
  noGlobsEvalMsg: 'no globs'
}

const globs = {
  event: data,
  ...data,
  ...data.state
}

ReactDOM.render(<App />, document.getElementById('root'))
