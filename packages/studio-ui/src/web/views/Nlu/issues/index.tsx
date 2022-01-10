import { Spinner } from '@blueprintjs/core'
import React, { useState } from 'react'
import { NluClient } from '../client'
import style from './style.scss'

interface Props {
  api: NluClient
  lang: string
}

const POLLING_INTERVAL = 1000

export const Linting: React.FC<Props> = (props: Props) => {
  const [modelId, setModelId] = useState<string | undefined>(undefined)
  const [linting, setLinting] = useState<any | undefined>(undefined)

  const startLinting = async () => {
    setLinting(undefined)
    const modelId = await props.api.startLinting(props.lang)
    setModelId(modelId)

    const interval = setInterval(async () => {
      const linting = await props.api.getLinting(modelId)
      if (linting.status !== 'linting') {
        setLinting(linting)
        clearInterval(interval)
      }
    }, POLLING_INTERVAL)
  }

  return (
    <div>
      <div className={style.button_header}>
        <button onClick={startLinting}>Start Linting</button>
        {modelId && !linting && <Spinner className={style.waiting_spinner} size={30} />}
      </div>
      {linting && <pre className={style.info_body}>{JSON.stringify(linting, undefined, 2)}</pre>}
    </div>
  )
}
