import { DatasetIssue, LintingState } from '@botpress/nlu-client'
import { NLU } from 'botpress/sdk'
import { utils } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useRef, useState } from 'react'

import { NluClient } from '../client'
import { issueGuard } from '../issues/guard'

import IntentHint from './IntentHint'
import Slots from './slots/Slots'
import style from './style.scss'
import { removeSlotFromUtterances, renameSlotInUtterances } from './utterances-state-utils'
import { UtterancesEditor } from './UtterancesEditor'

interface Props {
  intent: string
  api: NluClient
  contentLang: string
  showSlotPanel?: boolean
}

export const IntentEditor: FC<Props> = (props) => {
  const [intent, setIntent] = useState<NLU.IntentDefinition>()
  const [issues, setIssues] = useState<DatasetIssue<'E_000'>[]>([])

  const debouncedApiSaveIntent = useRef(
    _.debounce((newIntent: NLU.IntentDefinition) => props.api.createIntent(newIntent), 2500)
  )

  useEffect(() => {
    void props.api.fetchIntent(props.intent).then((intent) => {
      setIntent(intent)
      utils.inspect(intent)
    })

    void props.api.startLinting(props.contentLang).then(async (modelId) => {
      const interval = setInterval(async () => {
        const linting: LintingState = await props.api.getLinting(modelId)
        if (linting.status !== 'linting') {
          const relevantIssues = linting.issues
            .filter(issueGuard('E_000'))
            .filter((i) => i.data.intent === props.intent)
          setIssues(relevantIssues)
          clearInterval(interval)
        }
      }, 100)
    })

    return () => void debouncedApiSaveIntent.current.flush()
  }, [props.intent])

  if (!intent) {
    // TODO display a fetching state instead
    return null
  }

  const saveIntent = (newIntent: NLU.IntentDefinition) => {
    setIntent(newIntent)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props.api.createIntent(newIntent)
  }

  const handleUtterancesChange = async (newUtterances: string[]) => {
    setIssues([])
    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances } }
    setIntent(newIntent)
    await debouncedApiSaveIntent.current(newIntent)
  }

  const handleSlotsChange = (slots: NLU.SlotDefinition[], { operation, name, oldName }) => {
    let newUtterances = [...intent.utterances[props.contentLang]]
    if (operation === 'deleted') {
      newUtterances = removeSlotFromUtterances(newUtterances, name)
    } else if (operation === 'modified') {
      newUtterances = renameSlotInUtterances(newUtterances, oldName, name)
    }

    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances }, slots }
    saveIntent(newIntent)
  }

  const utterances = (intent && intent.utterances[props.contentLang]) || []

  return (
    <div className={style.intentEditor}>
      <div>
        <div className={style.header}>
          <IntentHint intent={intent} contentLang={props.contentLang} />
        </div>
        <UtterancesEditor
          intentName={intent.name}
          utterances={utterances}
          onChange={handleUtterancesChange}
          slots={intent.slots}
          issues={issues}
        />
      </div>
      {props.showSlotPanel && <Slots slots={intent.slots} api={props.api} onSlotsChanged={handleSlotsChange} />}
    </div>
  )
}
