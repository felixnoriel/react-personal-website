import getConfig from 'next/config'
const {publicRuntimeConfig} = getConfig();

let endpointWpAPI = 'http://35.227.92.179/wordpress/wp-json/wp/v2';
let endpoint = 'http://35.227.92.179';

if(publicRuntimeConfig.node_env === "development"){
   endpoint = 'http://localhost:3000';
}

export default {
    endpoint: endpoint
}
