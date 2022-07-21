/* eslint-disable no-console */
import { Icon, Tooltip, Spinner, Button } from '@blueprintjs/core'
import { Popover2, Tooltip2 } from '@blueprintjs/popover2'
import axios from 'axios'
import sdk, { NLU } from 'botpress/sdk'
import { lang, toast } from 'botpress/shared'
import classNames from 'classnames'
import { Training } from 'common/nlu-training'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

const BASE_NLU_URL = `${window.STUDIO_API_PATH}/nlu`
interface Props {
  bot: sdk.BotConfig
  trainSessions: {
    [lang: string]: NLU.TrainingSession
  }
  personalAccessToken?: string
}

const NeedTraining = () => {
  return <div className={style.tooltip}>{lang.tr('topNav.deploy.tooltip.needsTraining')}</div>
}

const TrainSessionDisplay = (props: { trainSession: NLU.TrainingSession }): JSX.Element => {
  const { trainSession } = props
  return (
    <div>
      <div>{trainSession.language}</div>
      <div>{trainSession.progress}</div>
      <div>{trainSession.status}</div>
    </div>
  )
}

const WorkspaceSelector = (props: {
  onWorkspaceChanged: (selectedWorkspace: any) => void
  cloudWorkspaces: any[]
}): JSX.Element => {
  const { cloudWorkspaces, onWorkspaceChanged } = props
  return (
    <div>
      <select onChange={(e) => onWorkspaceChanged(cloudWorkspaces.find((w) => w.id === e.target.value))}>
        {cloudWorkspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  )
}

const TrainSessionsDisplay = (props: { status: 'pending' | 'completed' }): JSX.Element => {
  const { status } = props
  return (
    <div>
      {status === 'pending' && (
        <div>
          <Spinner />
          Training ...
        </div>
      )}
      {status === 'completed' && <p>✅ Trained</p>}
    </div>
  )
}

const DeployBotDisplay = (props: { status: 'pending' | 'completed' }): JSX.Element => {
  const { status } = props
  return (
    <div>
      {status === 'pending' && (
        <div>
          <Spinner />
          Deploying ...
        </div>
      )}
      {status === 'completed' && <p>✅ Deployed</p>}
    </div>
  )
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
  const { trainSessions, bot, personalAccessToken } = props

  const isTrained = Object.values(trainSessions).reduce(
    (trained, session) => trained && session.status === 'done',
    true
  )

  const [lastImportDate, setLastImportDate] = useState(null)
  const [deployLoading, setDeployLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpened, setIsOpened] = useState(false)
  const [userAuthenticated, setUserAuthenticated] = useState(false)
  const [cloudWorkspaces, setCloudWorkspaces] = useState([])
  const [deploying, setDeploying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [training, setTraining] = useState(false)
  console.log({ isTrained })
  const [trainingCompleted, setTrainingCompleted] = useState(isTrained)
  const [deployCompleted, setDeployCompleted] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)

  // effects

  useEffect(() => {
    const fetchData = async () => {
      console.log('getting pat')
      const resp = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/authentication/pat`, {
        headers: { Authorization: `bearer ${personalAccessToken}` }
      })

      const isAuthenticated = resp.status === 200 && resp.headers['x-user-id'] !== undefined
      setUserAuthenticated(resp.status === 200 && resp.headers['x-user-id'] !== undefined)
      if (isAuthenticated) {
        console.log('fetching workspaces')
        const { data: workspaces } = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/workspaces`, {
          headers: { Authorization: `bearer ${personalAccessToken}` }
        })
        setCloudWorkspaces(workspaces)
      }
    }
    void fetchData()
  }, [])

  useEffect(() => {
    if (isOpened) {
      void onOpened()
    }
  }, [isOpened])

  useEffect(() => {
    console.log(`training effect: ${training}`)
    if (isOpened && trainingCompleted && cloudWorkspaces.length > 0) {
      void deployToCloud()
    }
  }, [isOpened, trainingCompleted, cloudWorkspaces])

  // helper methods
  const train = async () => {
    console.log('train() called')
    for (const [lang, trainSession] of Object.entries(trainSessions)) {
      await axios.post(`${BASE_NLU_URL}/train/${lang}`)
    }
  }

  const onOpened = async () => {
    if (userAuthenticated) {
      await deploy()
    }
  }

  const deploy = async () => {
    console.log('deploy() called')
    setDeployCompleted(false)
    if (!isTrained) {
      setTrainingCompleted(false)
      setTraining(true)
      await train()
    }
  }

  const onDeployClicked = async () => {
    await deploy()
  }

  if (training && isTrained) {
    setTraining(false)
    setTrainingCompleted(true)
  }

  const deployToCloud = async () => {
    console.log('calling /deploy')
    const w = bot.cloud ? cloudWorkspaces.find((w: any) => w.id === bot.cloud.workspaceId) : cloudWorkspaces[0]
    await axios.post(`${window.STUDIO_API_PATH}/cloud/deploy`, { workspaceId: w.id })
    console.log('setting deploy completed')
    setDeployCompleted(true)
    setTimeout(() => {
      setIsOpen(false)
    }, 1000)
  }

  // const deployToCloud = useCallback(() => {
  //   // if (deployLoading || !isTrained()) {
  //   //   return
  //   // }
  //   // toast.info(lang.tr('topNav.deploy.toaster.info'))
  //   // setDeployLoading(true)

  //   axios
  //     .get(`${window.STUDIO_API_PATH}/cloud/deploy`)
  //     .then((res) => res.data)
  //     .then((data) => {
  //       const { imported_on } = data
  //       toast.success(lang.tr('topNav.deploy.toaster.success'))
  //       setLastImportDate(imported_on)
  //       setDeployLoading(false)
  //     })
  //     .catch((err) => {
  //       setDeployLoading(false)
  //       switch (err.response?.status) {
  //         case 401:
  //           return toast.failure(lang.tr('topNav.deploy.toaster.error.token'))
  //         case 404:
  //           return toast.failure(lang.tr('topNav.deploy.toaster.error.introspect'))
  //         case 503:
  //           return toast.failure(lang.tr('topNav.deploy.toaster.error.runtimeNotReady'))
  //         default:
  //           return toast.failure(err.response?.data?.message ?? lang.tr('topNav.deploy.toaster.error.default'))
  //       }
  //     })
  // }, [setLastImportDate, setDeployLoading, deployLoading])

  // if (isTrained) {
  //   setTrainingCompleted(true)
  // }

  return (
    <>
      <Popover2
        position="bottom"
        content={
          <div>
            <h5>Deploy to Botpress Cloud</h5>
            <p>User authenticated: {`${userAuthenticated}`}</p>
            {!bot.cloud && (
              <div>
                <WorkspaceSelector
                  cloudWorkspaces={cloudWorkspaces}
                  onWorkspaceChanged={(ws) => {
                    setSelectedWorkspace(ws)
                  }}
                />
                <Button text="Deploy" onClick={() => onDeployClicked()} />
              </div>
            )}
            {bot.cloud && (
              <div>
                <TrainSessionsDisplay status={isTrained ? 'completed' : 'pending'} />
                <DeployBotDisplay status={deployCompleted ? 'completed' : 'pending'} />
              </div>
            )}
          </div>
        }
        interactionKind="click"
        matchTargetWidth={false}
        isOpen={isOpen}
        onOpened={() => {
          setIsOpened(true)
        }}
        onClosed={() => {
          setIsOpened(false)
        }}
        onInteraction={(nextOpenState) => {
          console.log({ nextOpenState })
          setIsOpen(nextOpenState)
        }}
      >
        <button
          className={classNames(style.item, { [style.disabled]: deployLoading }, style.itemSpacing)}
          id="statusbar_deploy"
        >
          <span className={style.label}>{lang.tr('topNav.deploy.btn')}</span>
        </button>
      </Popover2>
    </>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  bot: state.bot,
  trainSessions: state.nlu.trainSessions,
  personalAccessToken: state.user.personalAccessToken
})

export default connect(mapStateToProps)(DeployCloudBtn)
