import { autocompletion, Completion, CompletionContext } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { cursorSubwordForward } from '@codemirror/commands'
import TreeModel from 'tree-model'

import InfoCard from './InfoCard'
import { libs } from '../../../utils/tokenEval'
import { DocNode } from './types'
import eventTree from './eventTree.json'

const BOOST_KEYS: any = {
  context: 5,
  user: 4,
  session: 3,
  temp: 2,
  state: 1,
  __stacktrace: -5
}
const COMPLETE_AFTER = ['PropertyName', '.', '?.', '[']
const DONT_COMPLETE_IN = [
  'String',
  'TemplateString',
  'LineComment',
  'BlockComment',
  'VariableDefinition',
  'PropertyDefinition'
]

const tree = new TreeModel()

const fullDocTree: DocNode = tree.parse(eventTree as any)

const makeCompletionFrom = (from: number, glob: any = {}, docTree: DocNode, apply?: (key: string) => {}) => {
  if (typeof glob !== 'object' && typeof glob !== 'function') return null

  return {
    from,
    span: /^\w{2,}$/,
    options: Object.keys(glob).reduce((accu: any, key: string) => {
      const docNode = docTree.first({ strategy: 'breadth' }, (node: DocNode) => {
        return node.model.key === key
      })
      const type = docNode?.model.type || typeof glob[key] || 'Unknown'
      accu.push({
        label: key,
        boost: BOOST_KEYS[key] || 0,
        detail: type,
        info: InfoCard({
          key,
          type,
          link: docNode?.model.link || null,
          docs: docNode?.model.docs || null,
          evals: typeof glob[key] === 'object' ? null : glob[key]
        }),
        apply: apply ? apply(key) : key
      })
      return accu
    }, [])
  }
}

const globsCompletions = (globs: any) => {
  globs = {
    ...globs,
    ...libs
  }
  return (ctx: CompletionContext) => {
    const nodeBefore = syntaxTree(ctx.state).resolveInner(ctx.pos, -1)

    // any input around whitespace is considered in script OR
    // if brackets are just opened and no whitespace this means its empty
    if (COMPLETE_AFTER.includes(nodeBefore.name) && nodeBefore.parent?.name === 'MemberExpression') {
      const object = nodeBefore.parent.getChild('Expression')
      const varPath = ctx.state
        .sliceDoc(object?.from, object?.to)
        .replace('?', '')
        .replace('[', '.')
        .replace(']', '')
        .split(/\.|\?\./)

      const from = /[\.\[]/.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from
      const varResult = varPath.reduce((accu: any, varStr: string) => (accu = accu[varStr] || {}), globs)
      const cutDocTree = varPath.reduce((accu: any, el: any) => {
        return (
          accu.first({ strategy: 'breadth' }, (node: DocNode) => {
            if (node.model.key === el || node.model.key === '*') return true
          }) || accu
        )
      }, fullDocTree)

      return makeCompletionFrom(from, varResult, cutDocTree)
    } else if (nodeBefore.name === 'VariableName' || nodeBefore.name === 'Script') {
      return makeCompletionFrom(nodeBefore.from, globs, fullDocTree)
    } else if (nodeBefore.name === '{' && nodeBefore.parent?.name === 'Block') {
      return makeCompletionFrom(ctx.pos, globs, fullDocTree, key => {
        return (view: EditorView, completion: Completion, from: number) => {
          const applyStr = ` ${key} `
          view.dispatch({
            changes: { from, insert: applyStr }
          })
          cursorSubwordForward(view)
        }
      })
    } else if (ctx.explicit && !DONT_COMPLETE_IN.includes(nodeBefore.name)) {
      return makeCompletionFrom(ctx.pos, globs, fullDocTree, key => {
        return (view: EditorView, completion: Completion, from: number) => {
          const applyStr = `{{ ${key} }}`
          view.dispatch({
            changes: { from, insert: applyStr }
          })
          cursorSubwordForward(view)
          cursorSubwordForward(view)
        }
      })
    }
    return null
  }
}

const bpAutocomplete = (globs: any) => {
  return autocompletion({
    override: [globsCompletions(globs)],
    icons: false,
    optionClass: (completion: Completion) => {
      let className = 'cm-options '
      if (Object.keys(BOOST_KEYS).includes(completion.label)) className += 'cm-options-common '
      if (completion.detail === 'function') className += 'cm-option-func '
      return className
    }
  })
}

export default bpAutocomplete
