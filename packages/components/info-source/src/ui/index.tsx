import React from 'react'
import './style.css'
import translations from '../translations'
import { InfoSource } from './typings'

const InfoSource = (props: InfoSource) => {
  const userLang = props.intl.locale

  return (
    <div>
      {props.children}
      <div className="bpw-info_source-source">
        <a className="bpw-info_source-url" target="_blank" href={props.url}>
          {translations[userLang].source}
        </a>
        · <span className="bpw-info_source-time">{props.lastUpdate}</span>
      </div>
    </div>
  )
}

export default InfoSource
