const withTypescript = require('@zeit/next-typescript');
const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');

const nextConfig = {
    publicRuntimeConfig: {
        env: process.env.NODE_ENV
    },
};

module.exports = withCss(withSass(withTypescript(nextConfig)));
