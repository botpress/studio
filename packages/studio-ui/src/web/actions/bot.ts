import axios from 'axios'
import { createAction } from 'redux-actions'

export const botInfoReceived = createAction('BOT/INFO_RECEIVED')
export const fetchBotInformation = () => (dispatch) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  axios.get(`${window.STUDIO_API_PATH}/config`).then((information) => {
    dispatch(botInfoReceived(information.data))
  })
}

export const botsReceived = createAction('BOTS/RECEIVED')
export const fetchBotIds = () => (dispatch) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  axios.get(`${window.BOT_API_PATH}/workspaceBotsIds`).then((res) => {
    dispatch(botsReceived(res.data))
  })
}
