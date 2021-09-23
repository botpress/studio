import * as sdk from 'botpress/sdk'

export interface AuthGateData {
  loginMessage: string
  inviteMessage: string
  promptLogin: boolean
  inviteCodeRetry: number
}

export const generateFlow = async (
  data: any,
  metadata: sdk.FlowGeneratorMetadata
): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(),
    flow: {
      nodes: createNodes(data),
      catchAll: {
        next: []
      }
    }
  }
}

const createNodes = (data: AuthGateData) => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'internal-users/auth_gate'
        }
      ],
      next: [
        // prevents the user from being stuck if he ignores the prompt
        { condition: `temp.gatePromptCount > 2 && ${data.promptLogin}`, node: '#' },
        { condition: `temp.inviteRequired && ${data.promptLogin}`, node: 'ask-invite' },
        { condition: `!temp.authorized && ${data.promptLogin}`, node: 'ask-login' },
        { condition: 'true', node: '#' }
      ]
    },
    {
      name: 'ask-login',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'internal-users/auth_prompt'
        },
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.loginMessage}`
        }
      ],
      next: [{ condition: 'true', node: 'validate' }]
    },
    {
      name: 'validate',
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'internal-users/auth_validate'
        }
      ],
      next: [
        { condition: 'temp.inviteRequired === true', node: 'ask-invite' },
        { condition: 'true', node: 'entry' }
      ]
    },
    {
      name: 'ask-invite',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.inviteMessage}`
        }
      ],
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'internal-users/auth_validate'
        }
      ],
      next: [
        {
          condition: `Number(temp.inviteInvalidCount) < ${data.inviteCodeRetry} && !session.isAuthorized`,
          node: 'ask-invite'
        },
        { condition: 'true', node: 'entry' }
      ]
    }
  ]
  return nodes
}

const createTransitions = (): sdk.NodeTransition[] => {
  return [
    { caption: 'Authorized', condition: 'temp.authorized', node: '' },
    { caption: 'Unauthorized', condition: '!temp.authorized', node: '' }
  ]
}

export default { generateFlow }
