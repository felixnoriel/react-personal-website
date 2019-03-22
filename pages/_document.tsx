import Document, { Head, Main, NextScript } from 'next/document'
import getConfig from 'next/config'

import GoogleTagManager from '../components/google/GoogleTagManager';

const { publicRuntimeConfig } = getConfig();

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);

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
