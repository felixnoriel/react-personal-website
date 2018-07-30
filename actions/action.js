import service from '../helpers/service';

export const get = () => dispatch => {
 
     dispatch({
      type: 'GET',
      payload: []
     })

     service.get('url').then( promise => {
        return promise.json();
     }).then( json => {
        dispatch({
          type: 'GET',
          payload: json
        })
     })
 
}