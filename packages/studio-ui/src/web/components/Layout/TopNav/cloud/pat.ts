import axios from 'axios'

export const fetchPatStatus = async (pat: string, ac: AbortController): Promise<boolean> => {
  const resp = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/pat/authenticate`, {
    headers: { Authorization: `bearer ${pat}` },
    validateStatus: () => true,
    signal: ac.signal
  })

  const authenticated = resp.status === 204 && resp.headers['x-user-id'] !== undefined
  return authenticated
}
