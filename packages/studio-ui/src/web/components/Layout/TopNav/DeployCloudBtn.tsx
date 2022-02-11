import { Icon, Tooltip, Popover, Position } from '@blueprintjs/core'
import axios from 'axios'
import { CloudConfig } from 'botpress/sdk'
import { lang, ShortcutLabel, utils } from 'botpress/shared'
import classNames from 'classnames'
import qs from 'querystring'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { RootReducer } from '~/reducers'

import style from './style.scss'

interface Props {
  cloud: CloudConfig
  trainStatus: string
  botId: string
}

const DeployInfoContainer = styled.div`
  width: 100px;
`

const NeedTraining = () => {
  return <div className={style.tooltip}>Needs training</div>
}
const DeployInfo = () => {
  return <div className={style.tooltip}>Deploy to Cloud</div>
}

// archiveUrl: `/admin/workspace/bots/${botId}/export`,
// archiveName: `bot_${botId}_${Date.now()}.tgz`
const DeployCloudBtn = (props: Props) => {
  const { cloud, trainStatus, botId } = props
  const { oauthUrl, clientId, clientSecret } = cloud

  const deployToCloud = async () => {
    // console.log('test here: ')
    // const { data } = await axios.get(`/admin/workspace/bots/${botId}/export`, {
    //   responseType: 'blob',
    //   onDownloadProgress: (evt) => {
    //     console.log(Math.round((evt.loaded / evt.total) * 100))
    //   }
    // })
    // const botMultipart = new FormData()
    // botMultipart.append('file', data, `bot_${botId}_${Date.now()}.tgz`)

    // const response = await axios
    //   .post(`${window.STUDIO_API_PATH}/cloud/deploy`, botMultipart, {
    //     headers: {
    //       'Content-Type': `multipart/form-data; boundary=${data._boundary}`
    //     },
    //     // timeout: 30000,
    //     onDownloadProgress: (evt) => {
    //       console.log(Math.round((evt.loaded / evt.total) * 100))
    //     }
    //   })
    //   .then((res) => {
    //     console.log(res.status)
    //     return res.data
    //   })
    //   .catch(console.log)
    // const token = await axios
    //   .post(
    //     oauthUrl,
    //     qs.stringify({
    //       client_id: clientId,
    //       client_secret: clientSecret,
    //       grant_type: 'client_credentials'
    //     }),
    //     {
    //       headers: { 'Access-Control-Allow-Origin': '*' }
    //     }
    //   )
    //   .then((res) => res.data.access_token)

    // if (!token) {
    //   throw new Error('no auth')
    // }

    console.log('before call')
    const { data } = await axios.get(`${window.STUDIO_API_PATH}/cloud/deploy`)
    console.log('testing something: ', data)
    // const botMultipart = new FormData()
    // botMultipart.append('file', data, `bot_${botId}_${Date.now()}.tgz`)
    // `/admin/workspace/bots/${botId}/export`
    // await axios
    //   .post('https://controllerapi.botpress.dev', data, {
    //     headers: {
    //       'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
    //       Authorization: `Bearer ${token}`,
    //       'Access-Control-Allow-Origin': '*'
    //     },
    //     // timeout: 30000,
    //     onDownloadProgress: (evt) => {
    //       console.log(Math.round((evt.loaded / evt.total) * 100))
    //     }
    //   })
    //   .then((res) => {
    //     console.log(res.status)
    //   })
    //   .catch(console.log)
  }

  return (
    <Popover content={<DeployInfoContainer>hello</DeployInfoContainer>} position={Position.BOTTOM_LEFT}>
      <Tooltip content={trainStatus === 'needs-training' ? <NeedTraining /> : <DeployInfo />}>
        <button className={classNames(style.item, style.itemSpacing)} onClick={deployToCloud} id="statusbar_emulator">
          <Icon color="#1a1e22" icon="cloud-upload" iconSize={16} />
          <span className={style.label}>{'Deploy To Cloud'}</span>
        </button>
      </Tooltip>
    </Popover>
  )
}
// lang.tr('topNav.emulator')
const mapStateToProps = (state: RootReducer) => ({
  botId: state.bot.id,
  cloud: state.bot.cloud,
  trainStatus: state.nlu.trainSessions.status
})

export default connect(mapStateToProps)(DeployCloudBtn)
