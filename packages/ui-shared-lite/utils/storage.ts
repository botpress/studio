import Cookie from 'js-cookie'

export interface BPStorage {
  set: <T>(key: string, value: T) => void
  get: <T>(key: string) => T | undefined
  del: (key: string) => void
}

let useSessionStorage = new Boolean(window.USE_SESSION_STORAGE)
let storageDriver: 'cookie' | Storage
const getDriver = (): 'cookie' | Storage => {
  if (storageDriver && window.USE_SESSION_STORAGE === useSessionStorage) {
    return storageDriver
  }

  try {
    useSessionStorage = new Boolean(window.USE_SESSION_STORAGE)

    const storage =
      window.USE_SESSION_STORAGE === true && typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage

    const tempKey = '__storage_test__'
    storage.setItem(tempKey, tempKey)
    storage.removeItem(tempKey)

    return (storageDriver = storage)
  } catch (e) {
    return (storageDriver = 'cookie')
  }
}

const serialize = <T>(value: T): string => {
  let strValue = ''
  if (typeof value !== 'string') {
    try {
      strValue = JSON.stringify(value)
    } catch {}
  } else {
    strValue = value
  }

  return strValue
}

const deserialize = <T>(strValue?: string | null): T | undefined => {
  if (strValue === undefined || strValue === null) {
    return undefined
  }

  let value: T | undefined = undefined
  try {
    value = JSON.parse(strValue)
  } catch {
    value = strValue as any
  }

  return value
}

const storage: BPStorage = {
  set: <T>(key: string, value: T) => {
    try {
      const driver = getDriver()
      driver !== 'cookie' ? driver.setItem(key, serialize(value)) : Cookie.set(key, serialize(value))
    } catch (err) {
      console.error('Error while setting data into storage.', err.message)
    }
  },
  get: <T>(key: string): T | undefined => {
    try {
      const driver = getDriver()
      return driver !== 'cookie' ? deserialize(driver.getItem(key)) : deserialize(Cookie.get(key))
    } catch (err) {
      console.error('Error while getting data from storage.', err.message)
    }
  },
  del: (key: string) => {
    try {
      const driver = getDriver()
      driver !== 'cookie' ? driver.removeItem(key) : Cookie.remove(key)
    } catch (err) {
      console.error('Error while deleting data from storage.', err.message)
    }
  }
}

/**
 * Exposing this logic so modules & others can access it.
 * Sometimes the browser denies access to local storage (or simply doesn't support it), so we offer a fallback
 */
window.BP_STORAGE = storage

export default storage
