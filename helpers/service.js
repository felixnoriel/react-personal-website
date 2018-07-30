import fetch from 'isomorphic-unfetch'
import config from './config';

function get(params){
    const res =  fetch(config.endpoint + params);
    return res;
}

export default {
    get
}