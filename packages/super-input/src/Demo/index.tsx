import styled from 'styled-components'

import useStateData from './hooks/useStateData'
import { SiTemplate } from '../SuperInput'

const Wrapper = styled.div`
  display: grid;
  gap: 2rem;
  width: 100%;
  max-width: 700px;

  h1,
  h2 {
    margin: 0;
  }
`

const Section = styled.section`
  display: grid;
  gap: 0.5rem;
`

const code1 = `{{event.state.user.language}} text in between {{ _.add(9, 10) }} else if keywords {{ user.language }}`

const code2 = `{{user.timezone}} is the time zone sir and {{user.language}} is the language!`

const code3 = `I wish you a very happy new year and happy {{ state.session.usename }} birthday!

Math function: {{ Math.round(session.slots.device.confidence) }}
Timezone: {{user.timezone}}
Object Demo: {{ Object.keys({hello: "world"}) }}

This is the end.`

const Demo = () => {
  const fakeState = useStateData()
  const globs = {
    event: fakeState,
    ...fakeState,
    ...fakeState.state
  }

  return (

    <Wrapper>
      <h1>Superinput Inspector</h1>
      <Section>
        <h2>Valid</h2>
        <SiTemplate value={code1} maxHeight="100px" globs={globs} />
      </Section>
      <Section>
        <h2>Invalid</h2>
        <SiTemplate value={code2} maxHeight="100px" globs={globs} />
      </Section>
      <Section>
        <h2>Something Else</h2>
        <SiTemplate value={code3} maxHeight="300px" globs={globs} />
      </Section>
    </Wrapper>
  )
}

export default Demo
