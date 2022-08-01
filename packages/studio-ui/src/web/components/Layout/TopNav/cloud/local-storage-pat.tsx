import React, { useEffect } from 'react'
import { fetchPatStatus } from './pat'

const LOCALSTORAGE_KEY = 'bp/pat'

export const LocalStoragePat = (props: { onCompleted: (value?: string) => void }): JSX.Element => {
  const { onCompleted } = props

  useEffect(() => {
    const initialPatValue = localStorage.getItem(LOCALSTORAGE_KEY)

    const ac = new AbortController()

    const validateInitialPat = async (pat: string) => {
      const valid = await fetchPatStatus(pat, ac)
      if (valid) {
        onCompleted(pat)
      } else {
        onCompleted()
      }
    }

    if (initialPatValue) {
      void validateInitialPat(initialPatValue)
    } else {
      onCompleted()
    }

    return () => ac.abort()
  }, [])

  return <></>
}
