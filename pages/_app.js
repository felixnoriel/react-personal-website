import App, {Container} from 'next/app'
import React from 'react'
import { Provider } from 'react-redux'
import withReduxStore from '../with-redux-store'

class MyApp extends App {
  static async getInitialProps ({ Component, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return {pageProps}
  }

  render () {
    const {Component, pageProps, reduxStore} = this.props
    return <Container>
            <Provider store={reduxStore}>
              <Component {...pageProps} />
            </Provider>
          </Container>
  }
}

export default withReduxStore(MyApp)