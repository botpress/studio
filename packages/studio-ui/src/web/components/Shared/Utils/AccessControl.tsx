import { checkRule } from 'common/auth'
import React from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import store from '~/store'

import { AccessControlProps, PermissionAllowedProps } from './typings'

export const isOperationAllowed = (params: PermissionAllowedProps) => {
  return true
}

const PermissionsChecker = (props: AccessControlProps) => {
  const { user, resource, operation, superAdmin, children, fallback = null } = props
  return isOperationAllowed({ user, resource, operation, superAdmin }) ? children : fallback
}

const mapStateToProps = state => ({ user: state.user })

const ConnectedAccessControl = connect(mapStateToProps, undefined)(PermissionsChecker)

export default props => <ConnectedAccessControl {...props} store={store} />
