import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view'

import jsRange from '../../utils/jsRange'
import { evalMatchToken } from '../../utils/tokenEval'

const validHighlight = Decoration.mark({ class: 'cm-block valid' })
const invalidHighlight = Decoration.mark({ class: 'cm-block invalid' })
const defHighlight = Decoration.mark({ class: 'cm-block def' })
const boldText = Decoration.mark({ class: 'cm-block bold' })

const exprDecorator = (globs: any) => {
  // if (!globs) return []

  const highlight = (view: EditorView): DecorationSet => {
    const docStr = view.state.doc.sliceString(0)
    const matches = jsRange(docStr)
    if (!matches) return Decoration.set([])

    let pos = 0
    let decos = matches.map(match => {
      const from = docStr.indexOf(match, pos)
      const to = from + match.length
      pos = to

      if (!globs) return defHighlight.range(from, to)
      if (evalMatchToken(match, globs) !== undefined) return validHighlight.range(from, to)
      else return invalidHighlight.range(from, to)
    })

    return Decoration.set(decos)
  }

  const exprDecoratorsPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(readonly view: EditorView) {
        this.decorations = highlight(view)
      }

      update(update: ViewUpdate) {
        const { docChanged, view } = update
        if (docChanged) this.decorations = highlight(view)
      }
    },
    {
      decorations: v => v.decorations
    }
  )
  return [exprDecoratorsPlugin]
}

export default exprDecorator
