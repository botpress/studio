import axios from 'axios'
import { createAction } from 'redux-actions'

export const userReceived = createAction('USER/RECEIVED')
export const fetchUser = () => (dispatch) => {
  if (window.IS_STANDALONE) {
    return dispatch(userReceived({ email: 'admin', isSuperAdmin: true }))
  }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  axios.get(`${window.API_PATH}/admin/user/profile`).then((res) => {
    dispatch(userReceived(res.data?.payload))
  })
}
