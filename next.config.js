const process = require('process');
const path = require('path');
const appConfig = Object.assign({}, require(path.join(__dirname, 'config', process.env.APP_ENV || 'development')));

const withTypescript = require('@zeit/next-typescript');
const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');

console.log(appConfig)

const nextConfig = {
    serverRuntimeConfig: appConfig,
    publicRuntimeConfig: appConfig,
};

module.exports = withCss(withSass(withTypescript(nextConfig)));
