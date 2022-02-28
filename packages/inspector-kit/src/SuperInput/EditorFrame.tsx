import React, { forwardRef } from 'react'
import style from './EditorFrame.module.scss'

const EditorFrame = forwardRef((props: any, ref: any) => {
  return (
    <div className={style.bpEditor} ref={ref}>
      {props.children}
    </div>
  )
})

export default EditorFrame
