import { PureComponent } from 'react'
import fetch from 'isomorphic-unfetch'
import config from '../helpers/config';
import service from '../helpers/service';

import MainContainer from '../containers/MainContainer'
//import { Link } from '../routes';

export default class Index extends PureComponent{

  //second to be called
  constructor(props){
    super(props)
  }
  
  //first to be called
  /*
    params pathname = url
    query - quer string section of url
    asPath - string of actual path
    req - http request (server only)
    res - http response (server only)
    jsonPageRes - fetch response ( client only)
    err - error object
  */
  static async getInitialProps ({ req, pathname, params, query }) { 

    const parameters = {  

          };

    return parameters;
  }

  //third to be called
  //<MainContainer />
  render(){
    return (
        <div>
        WORKING
        </div>
    )
  }
}
