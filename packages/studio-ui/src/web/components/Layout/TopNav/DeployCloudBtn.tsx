import { Icon, Tooltip, Spinner, Popover, Position } from '@blueprintjs/core'
import axios from 'axios'
import { CloudConfig } from 'botpress/sdk'
import { lang, ShortcutLabel, utils, toast } from 'botpress/shared'
import classNames from 'classnames'
import { Training } from 'common/nlu-training'
import React, { useCallback, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

interface Props {
  trainSession: Training
}

const NeedTraining = () => {
  return <div className={style.tooltip}>Needs training</div>
}
const DeployInfo = ({ lastImportDate }) => {
  const importDateStr = useCallback(() => {
    if (!lastImportDate) {
      return null
    }
    const date = new Date(lastImportDate)
    return date.toString()
  }, [lastImportDate])

  return (
    <div className={style.tooltip}>{importDateStr() ? 'Last Deployed on' + ` ${importDateStr()}` : 'Deploy Bot'}</div>
  )
}
const Deploying = () => {
  return <div className={style.tooltip}>Deploying Now...</div>
}

// archiveUrl: `/admin/workspace/bots/${botId}/export`,
// archiveName: `bot_${botId}_${Date.now()}.tgz`
const DeployCloudBtn = (props: Props) => {
  const { trainSession } = props
  const [lastImportDate, setLastImportDate] = useState(null)
  const [deployLoading, setDeployLoading] = useState(false)

  useEffect(() => {
    axios
      .get(`${window.STUDIO_API_PATH}/cloud/info`)
      .then((res) => res.data)
      .then((data) => {
        const { imported_on } = data
        setLastImportDate(imported_on)
      })
      .catch(console.log)
  }, [])

  const deployToCloud = useCallback(() => {
    toast.info('Trying to deploy bot')
    setDeployLoading(true)
    axios
      .get(`${window.STUDIO_API_PATH}/cloud/deploy`)
      .then((res) => res.data)
      .then((data) => {
        const { imported_on } = data
        console.log(data)
        toast.success('bot uploaded ')
        setLastImportDate(imported_on)
        setDeployLoading(false)
      })
      .catch((e) => {
        toast.failure('bot not uploaded')
        setDeployLoading(false)
      })
  }, [setLastImportDate, setDeployLoading])

  const isTrained = useCallback(() => {
    return Object.keys(trainSession).reduce((trained, lang) => {
      if (trainSession[lang].status !== 'done') {
        trained = false
      }
      return trained
    }, true)
  }, [trainSession])

  return (
    <Tooltip
      content={
        !isTrained() ? <NeedTraining /> : deployLoading ? <Deploying /> : <DeployInfo lastImportDate={lastImportDate} />
      }
    >
      <button
        className={classNames(style.item, { [style.disabled]: deployLoading || !isTrained() }, style.itemSpacing)}
        onClick={deployToCloud}
        id="statusbar_deploy"
        disabled={deployLoading || !isTrained()}
      >
        {deployLoading ? <Spinner size={16} /> : <Icon icon="cloud-upload" iconSize={16} />}
        <span className={style.label}>{'Deploy To Cloud'}</span>
      </button>
    </Tooltip>
  )
}
// lang.tr('topNav.emulator')
const mapStateToProps = (state: RootReducer) => ({
  trainSession: state.nlu.trainSessions
})

export default connect(mapStateToProps)(DeployCloudBtn)
