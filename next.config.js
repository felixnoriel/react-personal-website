const withTypescript = require('@zeit/next-typescript');
const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');

const nextConfig = {
    target: 'serverless',
    env: {
        env: process.env.NODE_ENV,
        domain: 'https://whoisfelix.com',
    },
};

module.exports = withCss(withSass(withTypescript(nextConfig)));
