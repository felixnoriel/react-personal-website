import getConfig from 'next/config'
const {publicRuntimeConfig} = getConfig();

let endpointWpAPI = '//whoisfelix.com/wordpress/wp-json/wp/v2';
let endpoint = '//whoisfelix.com';

if(publicRuntimeConfig.env === "development"){
   endpoint = 'http://localhost:3000';
}
// console.log(`publicRuntimeConfig.node_env : ${publicRuntimeConfig.node_env} | endpoint: ${endpoint}`);
export default {
    endpoint: endpoint,
    endpointWpAPI: endpointWpAPI
}
