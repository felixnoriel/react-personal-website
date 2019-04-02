import * as React from 'react';
import Document, { Head, Main, NextScript, NextDocumentContext } from 'next/document'
import { GoogleTagManager } from '../components/google/GoogleTagManager';

export default class MyDocument extends Document {
  
  static async getInitialProps(ctx: NextDocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render () {

    return (
      <html>
        <Head>
          <link rel="stylesheet" href="/_next/static/style.css" />
        </Head>
        <body>
          <GoogleTagManager scriptId="google-tag-manager" gtmId="GTM-PKHZBV4" type="noscript"/>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
