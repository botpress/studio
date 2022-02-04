import { completionKeymap } from '@codemirror/autocomplete'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { classHighlightStyle } from '@codemirror/highlight'
import { history, historyKeymap } from '@codemirror/history'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState, Extension } from '@codemirror/state'
import { placeholder as placeholderExt, keymap, EditorView, ViewUpdate } from '@codemirror/view'
import React, { useEffect, useState, useRef, MutableRefObject } from 'react'

import EditorFrame from './EditorFrame'
import EvalPanel from './EvalPanel'
import { bpAutocomplete, BPLang, hoverInspect, exprDecorator } from './extensions'
import { SI_TYPES, ISiProps } from './types'
import { isError, evalStrTempl } from './utils/tokenEval'

export default function SuperInput({
  value,
  eventState,
  onChange,
  placeholder,
  autoFocus = false,
  type = SI_TYPES.TEMPLATE,
  noGlobsEvalMsg = ''
}: ISiProps) {
  const editor = useRef() as MutableRefObject<HTMLInputElement>
  const [panel, setPanel] = useState('')
  const [view, setView] = useState() as [EditorView, React.Dispatch<React.SetStateAction<EditorView>>]

  useEffect(() => {
    const onUpdate = (update: ViewUpdate) => {
      const { focusChanged, docChanged, view } = update
      const value = update.state.doc.sliceString(0)

      if (!view.hasFocus) {
        setPanel('')
      } else if (focusChanged || docChanged) {
        setPanel(!eventState ? noGlobsEvalMsg : evalStrTempl(value, eventState) || '')
      }

      if (docChanged && onChange) {
        onChange(value)
      }
    }

    let typeExt: Extension[] = []
    const keymapList = [...closeBracketsKeymap, ...historyKeymap]

    if (type === SI_TYPES.TEMPLATE) {
      typeExt = [BPLang(), exprDecorator(eventState)]
      keymapList.push(...completionKeymap)
    } else if (type === SI_TYPES.EXPRESSION || type === SI_TYPES.BOOL) {
      typeExt = [javascript()]
    }

    const extensions = [
      EditorView.updateListener.of(onUpdate),
      EditorView.lineWrapping,
      classHighlightStyle,
      placeholderExt(placeholder || ''),
      ...typeExt,
      hoverInspect(eventState),
      bpAutocomplete(eventState),
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

    if (autoFocus) {
      newView.focus()
    }

    return () => {
      view?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!view) {
      return
    }

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
        <EvalPanel valid={eventState ? true : null} text={panel} />
      ) : null}
    </EditorFrame>
  )
}
