import ReactDOM from 'react-dom'
import JSONTree from 'react-json-tree'
import './InspectCard.scss'

// const json = {
//   something: 'thing',
//   something2: 12345,
//   booleanstoo: true,
//   whyNot: {
//     ooo: 'ahhhh'
//   }
// }

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#ffffff', // background
  base01: '#383830',
  base02: '#49483e',
  base03: '#738694', // {}
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#a854a8', // undefined
  base09: '#d9822b', // number
  base0A: '#f4bf75',
  base0B: '#15b371', // string
  base0C: '#a1efe4',
  base0D: '#3276ea', // property
  base0E: '#ae81ff',
  base0F: '#cc6633'
}

interface IInspectCardProps {
  title: string
  inspect: any
}

const InspectCard = (props: IInspectCardProps) => {
  const { title, inspect } = props
  let dom = document.createElement('div')
  ReactDOM.render(
    <>
      <h3 className="bp3-ui-text inspectHeader">{title}</h3>
      <div className="inspectTree">
        <JSONTree data={inspect} theme={theme} invertTheme={false} />
      </div>
    </>,
    dom
  )
  return dom
}

export default InspectCard
