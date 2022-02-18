import { Icon, Tooltip, Spinner } from '@blueprintjs/core'
import axios from 'axios'
import { lang, toast } from 'botpress/shared'
import classNames from 'classnames'
import { Training } from 'common/nlu-training'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

interface Props {
  trainSession: Training
}

const NeedTraining = () => {
  return <div className={style.tooltip}>{lang.tr('topNav.deploy.tooltip.needsTraining')}</div>
}
const DeployInfo = ({ lastImportDate }) => {
  const importDateStr = useCallback(() => {
    if (!lastImportDate) {
      return null
    }

    return moment(lastImportDate).fromNow()
  }, [lastImportDate])

  return (
    <div className={style.tooltip}>
      {lastImportDate
        ? [lang.tr('topNav.deploy.tooltip.lastDeploy'), importDateStr()].join(' ')
        : lang.tr('topNav.deploy.tooltip.deployBot')}
    </div>
  )
}
const Deploying = () => {
  return <div className={style.tooltip}>{lang.tr('topNav.deploy.tooltip.deploying')}</div>
}

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
      .catch((e) => {})
  }, [])

  const deployToCloud = useCallback(() => {
    toast.info(lang.tr('topNav.deploy.toaster.info'))
    setDeployLoading(true)
    axios
      .get(`${window.STUDIO_API_PATH}/cloud/deploy`)
      .then((res) => res.data)
      .then((data) => {
        const { imported_on } = data
        setTimeout(() => {
          toast.success(lang.tr('topNav.deploy.toaster.success'))
          setLastImportDate(imported_on)
          setDeployLoading(false)
        }, 10000)
      })
      .catch((e) => {
        toast.failure(lang.tr('topNav.deploy.toaster.error'))
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
        <span className={style.label}>{lang.tr('topNav.deploy.btn')}</span>
      </button>
    </Tooltip>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  trainSession: state.nlu.trainSessions
})

export default connect(mapStateToProps)(DeployCloudBtn)
