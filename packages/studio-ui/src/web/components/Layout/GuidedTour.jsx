import React from 'react'
import Tour from 'reactour'
import storage from '../../util/storage'
import { Button } from '@blueprintjs/core'

// Change this key to display the tour the next time a user opens Botpress
const TOUR_KEY = 'guidedTour11_9_0'

export default class GuidedTour extends React.Component {
  componentDidMount() {
    if (!storage.get(TOUR_KEY)) {
      storage.set(TOUR_KEY, true)
      this.props.onToggle()
    }
  }

  componentDidCatch(error) {
    console.log('Error while processing guided tour', error)
  }

  render() {
    const steps = [
      {
        selector: '',
        content: 'Welcome to Botpress! This is a quick tour of the most important features.'
      },
      {
        selector: '.Pane.Pane1',
        content:
          'The Flows screen is the main interface where you can see and edit your conversation flows.'
      },
      {
        selector: '#bp-menu_nlu',
        content:
          'The Natural Language Understanding screen is where you will give example sentences to train the AI for understanding humans.'
      },
      {
        selector: '#bp-menu_qna',
        content: 'Anyone on your team can easily add questions and answers to the Q&A page.'
      },
      {
        selector: '#statusbar_emulator',
        content:
          'Use the emulator to try out your bot at any time! You can also use it to troubleshoot.'
      },
      {
        selector: '#all-bots-navigation',
        content: 'Finally, this button will allow you to return to the administration panel or switch bot.'
      },
      {
        selector: '',
        content: 'All done. Enjoy building bots! For more information, please refer to the guide on botpress.com/docs'
      }
    ]

    return (
      <Tour
        steps={steps}
        isOpen={this.props.isDisplayed}
        onRequestClose={this.props.onToggle}
        showNumber={false}
      />
    )
  }
}
