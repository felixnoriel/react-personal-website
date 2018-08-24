import fetch from 'isomorphic-unfetch'
import config from './config';

function getWPApi(posttype, params){
    let filter = "";
    if(params){
        for(var i in params){
            filter += '&' + i + '=' + params[i];
        }
    }

    //const res =  fetch(`${config.endpoint}/${posttype}?_embed=true${filter}`);
    const res =  fetch(`http://localhost:3000/${posttype}.json`);
    return res;
}

export default {
    getWPApi
}
