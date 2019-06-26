import * as React from 'react';
import App, { Container, NextAppContext } from 'next/app';
import * as StoreJS from 'store';
import config from '../helpers/config';
import APIClient from '../store/api/ApiClient';
import Service from '../store/api/Service';
import createStore, { RootServiceDependencies } from '../store';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import "../design/index.scss";

const isServer = typeof window === 'undefined'
const __NEXT_REDUX_STORE__: string = '__NEXT_REDUX_STORE__'

class ProviderApp extends App {

    constructor(props: any) {
        super(props);
    }
    
    static async getInitialProps(context: NextAppContext) {
        let pageProps = {};

        if (context.Component.getInitialProps) {
            pageProps = await context.Component.getInitialProps(context.ctx);

        }
        return { pageProps };
    }

    render() {
        const { Component, pageProps, store }: any = this.props;

        return (
            <Container>
                <Provider store={store}>
                    <Component {...pageProps} />
                </Provider>
            </Container>
        );
    }
}

const createDeps = (apiClient: APIClient): RootServiceDependencies => {
    const deps = {
        service: new Service(apiClient),
        storage: StoreJS,
    };
    return deps;
};

const initialiseStore = (initialState?: any) => {
    const apiClient = new APIClient(config.endpoint);
    const deps = createDeps(apiClient);
    const store: any = createStore(deps, initialState);
    apiClient.attachStore(store);

    return store;
}

function getOrCreateStore(initialState?: any) {
    // Always make a new store if server, otherwise state is shared between requests
    if (isServer) {
      return initialiseStore(initialState)
    }
  
    // Create store if unavailable on the client and set it on the window object
    if (!(window as any)[__NEXT_REDUX_STORE__]) {
      (window as any)[__NEXT_REDUX_STORE__] = initialiseStore(initialState)
    }
    return (window as any)[__NEXT_REDUX_STORE__]
  }

  const withRedux = (App: any) => {
    return class AppWithRedux extends React.Component {
      store: Store
      
      static async getInitialProps (appContext: any) {
        // Get or Create the store with `undefined` as initialState
        // This allows you to set a custom default initialState
        const reduxStore = getOrCreateStore()
  
        // Provide the store to getInitialProps of pages
        appContext.ctx.store = reduxStore
  
        let appProps = {}
        if (typeof App.getInitialProps === 'function') {
          appProps = await App.getInitialProps.call(App, appContext)
        }
  
        return {
          ...appProps,
          initialReduxState: reduxStore.getState()
        }
      }
  
      constructor(props: any) {
        super(props)
        this.store = getOrCreateStore(props.initialReduxState)
      }
  
      render() {
        return <App {...this.props} store={this.store} />
      }
    }
}

export default withRedux(ProviderApp);