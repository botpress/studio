import React, { forwardRef } from 'react'

const EditorFrame = forwardRef((props: any, ref: any) => {
  return (
    <div className="bp-editor" ref={ref}>
      {props.children}
    </div>
  )
})

export default EditorFrame
