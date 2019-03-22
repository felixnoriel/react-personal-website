import * as React from 'react';
import App, { Container, NextAppContext } from 'next/app';
import getConfig from 'next/config';
import * as StoreJS from 'store';

import APIClient from '../src/store/api/APIClient';
import Service from '../src/store/api/Service';
import createStore, { RootServiceDependencies } from '../src/store';
import { Store } from 'redux';
import { Provider } from 'react-redux';

const createDeps = (apiClient: APIClient): RootServiceDependencies => {
    const deps = {
        service: new Service(apiClient),
        storage: StoreJS,
    };
    return deps;
};

export default class ProviderApp extends App {
    deps: RootServiceDependencies;
    store: Store;

    constructor(props: any) {
        super(props);

        const config = getConfig();

        const apiClient = new APIClient(config.publicRuntimeConfig.api.baseUrl);
        this.deps = createDeps(apiClient);
        this.store = createStore(this.deps);
        apiClient.attachStore(this.store);
    }
    static async getInitialProps(context: NextAppContext) {
        let pageProps = {};

        if (context.Component.getInitialProps) {
            pageProps = await context.Component.getInitialProps(context.ctx);
        }

        return { pageProps };
    }

    render() {
        const { Component, pageProps } = this.props;

        return (
            <Container>
                <Provider store={this.store}>
                    <Component {...pageProps} />
                </Provider>
            </Container>
        );
    }
}
