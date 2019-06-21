const withTypescript = require('@zeit/next-typescript');
const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');

const nextConfig = {
    target: 'serverless',
    env: {
        env: process.env.NODE_ENV,
        domain: "https://felixnoriel-nextjs.felixnoriel.now.sh"
    }
};

module.exports = withCss(withSass(withTypescript(nextConfig)));