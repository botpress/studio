/**
 * Generates a link with all the required informations to perform a chat user login. It cannot be crafter manually.
 * The temp.login_url is to be consumed by a content element.
 *
 *  @example [Click here to login]({{temp.login_url}})
 *
 * @title Authentication Prompt
 * @category Authentication
 * @hidden true
 */
const authPrompt = async () => {
  const sessionId = bp.dialog.createId(event)
  const secureData = { botId: event.botId, sessionId }
  const signature = await bp.security.getMessageSignature(JSON.stringify(secureData))

  const baseUrl = `${process.EXTERNAL_URL}${process.ROOT_PATH}/admin/login`

  temp.login_url = `${baseUrl}?botId=${event.botId}&sessionId=${sessionId}&signature=${signature}`
}

return authPrompt()
