import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { Container } from '~/components/Shared/Interface'
import { RootReducer } from '~/reducers'
import style from './style.scss'

interface OwnProps {}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps & RouteComponentProps

const NodeEditor = (props: Props) => {
  return (
    <Container>
      <h1 className={style.style}>hi</h1>
    </Container>
  )
}

const mapStateToProps = (state: RootReducer) => ({})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(withRouter(NodeEditor))
