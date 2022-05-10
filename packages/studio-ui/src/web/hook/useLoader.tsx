import { Spinner } from '@blueprintjs/core'
import React from 'react'
import style from './style.scss'

const useLoader = () => {
  return (
    <div className={style.centerSpinner}>
      <Spinner intent="primary" size={100}>
        Loading...
      </Spinner>
    </div>
  )
}
export default useLoader
