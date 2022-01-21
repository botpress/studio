import React, { useEffect, useState, useRef, MutableRefObject } from 'react'
import { classHighlightStyle } from '@codemirror/highlight'
import { completionKeymap } from '@codemirror/autocomplete'
import { placeholder as placeholderExt, keymap, EditorView, ViewUpdate } from '@codemirror/view'
import { EditorState, Extension } from '@codemirror/state'
import { history, historyKeymap } from '@codemirror/history'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { javascript } from '@codemirror/lang-javascript'

import EditorFrame from './EditorFrame'
import EvalPanel from './EvalPanel'
import { bpAutocomplete, BPLang, hoverInspect, exprDecorator } from './extensions'
import { isError, evalStrTempl } from './utils/tokenEval'
import { SI_TYPES, ISiProps } from './types'

export default function Superinput({ value, type, globs, onChange, placeholder, noGlobsEvalMsg }: ISiProps) {
  if (!type) type = SI_TYPES.TEMPLATE
  const editor = useRef() as MutableRefObject<HTMLInputElement>
  const [panel, setPanel] = useState('')
  const [view, setView] = useState() as [EditorView, React.Dispatch<React.SetStateAction<EditorView>>]

  useEffect(() => {
    const onUpdate = (update: ViewUpdate) => {
      const { focusChanged, docChanged, view } = update
      const value = update.state.doc.sliceString(0)

      if (!view.hasFocus) setPanel('')
      else if (focusChanged || docChanged) setPanel(!globs ? noGlobsEvalMsg : evalStrTempl(value, globs) || '')

      if (docChanged && onChange) onChange(value)
    }

    let typeExt: Extension[] = []
    const keymapList = [...closeBracketsKeymap, ...historyKeymap]

    if (type === SI_TYPES.TEMPLATE) {
      typeExt = [BPLang(), hoverInspect(globs), bpAutocomplete(globs), exprDecorator(globs)]
      keymapList.push(...completionKeymap)
    } else if (type === SI_TYPES.EXPRESSION || type === SI_TYPES.BOOL) {
      typeExt = [javascript(), hoverInspect(globs), bpAutocomplete(globs)]
    }

    const extensions = [
      EditorView.updateListener.of(onUpdate),
      EditorView.lineWrapping,
      classHighlightStyle,
      placeholderExt(placeholder || ''),
      ...typeExt,
      history(),
      closeBrackets(),
      keymap.of(keymapList)
    ]

    const state = EditorState.create({
      doc: value,
      extensions
    })
    const newView = new EditorView({ state, parent: editor.current })
    setView(newView)

    return () => {
      if (view) view.destroy()
    }
  }, [])

  useEffect(() => {
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value || '' }
      })
    }
  }, [value, view])

  return (
    <EditorFrame ref={editor}>
      {isError(panel) ? (
        <EvalPanel valid={false} text={panel} />
      ) : panel ? (
        <EvalPanel valid={globs ? true : null} text={panel} />
      ) : null}
    </EditorFrame>
  )
}
