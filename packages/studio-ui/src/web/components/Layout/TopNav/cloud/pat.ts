import axios from 'axios'

export const fetchPatStatus = async (pat: string, ac: AbortController): Promise<boolean> => {
  try {
    await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/pat/authenticate`, {
      headers: { Authorization: `bearer ${pat}` },
      signal: ac.signal
    })
    return true
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return false
    }
    throw err
  }
}
