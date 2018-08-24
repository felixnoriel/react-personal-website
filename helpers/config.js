import getConfig from 'next/config'
const {publicRuntimeConfig} = getConfig();

let endpoint = 'http://35.227.92.179/wordpress/wp-json/wp/v2';

if(publicRuntimeConfig.node_env === "development"){
   endpoint = 'http://localhost:3000';    
}

export default {
    endpoint: endpoint
}
