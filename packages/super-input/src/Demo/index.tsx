import styled from 'styled-components'

import useStateData from './hooks/useStateData'
import { SiTemplate } from '../SuperInput'

const DemoContainer = styled.div`
  height: 100vh;
  width: 350px;
  display: flex;
  flex-direction: column;
  background-color: #e0e0e0;
  margin-left: auto;
  -webkit-box-shadow: -3px 0px 15px 5px rgba(0, 0, 0, 0.33);
  box-shadow: -3px 0px 15px 5px rgba(0, 0, 0, 0.33);
  font-family: monospace;
`

const Title = styled.h2`
  margin: 0;
`

const Field = styled.div`
  margin: 35px 15px;
  border-top: 1px solid gray;
  border-bottom: 1px solid gray;
  padding: 15px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Label = styled.h4`
  /* margin: 15px 15px; */
  margin: 0;
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
    <DemoContainer>
      <Title>SuperInput Inspector</Title>
      <Field>
        <Label>Valid</Label>
        <SiTemplate value={code1} globs={globs} />
      </Field>
      <Field>
        <Label>Invalid</Label>
        <SiTemplate value={code2} maxHeight="100px" globs={globs} />
      </Field>
      <Field>
        <Label>something else</Label>
        <SiTemplate value={code3} maxHeight="100px" globs={globs} />
      </Field>
    </DemoContainer>
  )
}

export default Demo
