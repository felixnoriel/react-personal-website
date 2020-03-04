import * as React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { GoogleTagManager } from '../src/components/google/GoogleTagManager';

export default class MyDocument extends Document {
    public static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    public render() {
        return (
            <html>
                <Head>
                    <link rel="stylesheet" href="/_next/static/style.css" />
                </Head>
                <body>
                    <GoogleTagManager scriptId="google-tag-manager" gtmId="GTM-PKHZBV4" type="noscript" />
                    <Main />
                    <NextScript />
                </body>
            </html>
        );
    }
}
