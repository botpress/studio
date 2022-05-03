import { Spinner } from '@blueprintjs/core'
import React from 'react'

const useLoader = () => {
  return (
    <div style={{ position: 'absolute', zIndex: 10, marginLeft: 'auto', marginRight: 'auto', left: 0, right: 0 }}>
      <Spinner intent="primary" size={100}>
        Loading...
      </Spinner>
    </div>
  )
}
export default useLoader
