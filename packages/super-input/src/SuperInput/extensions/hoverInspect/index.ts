import { hoverTooltip } from '@codemirror/tooltip'
import { syntaxTree } from '@codemirror/language'

import InspectCard from './InspectCard'

const hoverInspect = (globs: any) => {
  return hoverTooltip(
    (view, pos, side) => {
      let { from, to, text } = view.state.doc.lineAt(pos)
      // console.log('TEST HERE: ', `[${text[pos - 1]}]`, `[${text[pos]}]`, `[${text[pos + 1]}]`)
      let nodeBefore = syntaxTree(view.state).resolveInner(pos, 0)
      const object = nodeBefore.parent?.getChild('Expression')
      if (nodeBefore.name in ['VariableName', 'PropertyName'] || nodeBefore.parent?.name !== 'MemberExpression')
        return null

      const varPath = view.state
        .sliceDoc(object?.from, object?.to)
        .replace('?', '')
        .split(/\.|\?\./)
      const varResult = varPath.reduce((accu: any, varStr: string) => (accu = accu[varStr] || {}), globs)

      let start = pos,
        end = pos
      while (start > from && /\w/.test(text[start - from - 1])) start--
      while (end < to && /\w/.test(text[end - from])) end++
      if ((start === pos && side < 0) || (end === pos && side > 0)) return null

      const hoverWord = text.slice(start - from, end - from)

      let inspect: any = {}
      let title: string = ''
      if (varPath.length === 1 && varPath[0] === hoverWord) {
        inspect = varResult
        title = hoverWord
      } else {
        inspect = varResult[hoverWord]
        title = [...varPath, hoverWord].join('.')
      }

      return {
        pos: start,
        end,
        above: false,
        create(view) {
          return { dom: InspectCard({ title, inspect }) }
        }
      }
    },
    { hideOnChange: true }
  )
}
export default hoverInspect
