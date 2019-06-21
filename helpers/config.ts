let endpointWpAPI = '//whoisfelix.com/wordpress/wp-json/wp/v2';
let endpoint = '//whoisfelix.com';

if(process.env.NODE_ENV === "development"){
   endpoint = 'http://localhost:3000';
}
if (process.env.domain) {
    endpoint = process.env.domain;
}
// console.log(`publicRuntimeConfig.node_env : ${publicRuntimeConfig.node_env} | endpoint: ${endpoint}`);
export default {
    endpoint: endpoint,
    endpointWpAPI: endpointWpAPI
}
