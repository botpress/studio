import ReactDOM from 'react-dom'
import JSONTree from 'react-json-tree'
import styled from 'styled-components'

// const json = {
//   something: 'thing',
//   something2: 12345,
//   booleanstoo: true,
//   whyNot: {
//     ooo: 'ahhhh'
//   }
// }

const theme = {
  scheme: 'bright',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#000000',
  base01: '#303030',
  base02: '#505050',
  base03: '#b0b0b0',
  base04: '#d0d0d0',
  base05: '#e0e0e0',
  base06: '#f5f5f5',
  base07: '#ffffff',
  base08: '#fb0120',
  base09: '#fc6d24',
  base0A: '#fda331',
  base0B: '#a1c659',
  base0C: '#76c7b7',
  base0D: '#6fb3d2',
  base0E: '#d381c3',
  base0F: '#be643c'
}

const CardContainer = styled.div`
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-radius: 4px;

  h6 {
    margin: 0;
    padding: 0.3rem 1rem;
    border-bottom: 1px solid #b0b0b0;
    font-size: 1rem;
  }
  div {
    margin: 0 5px;
  }
`

interface IInspectCardProps {
  title: string
  inspect: any
}

const InspectCard = (props: IInspectCardProps) => {
  const { title, inspect } = props

  console.log('inspect: ', inspect)
  let dom = document.createElement('div')
  ReactDOM.render(
    <CardContainer>
      <h6>{title}</h6>
      <div>
        <JSONTree data={inspect} theme={theme} hideRoot={true} />
      </div>
    </CardContainer>,
    dom
  )
  return dom
}

export default InspectCard
