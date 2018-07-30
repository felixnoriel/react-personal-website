export default (state = {}, action) => {
 switch (action.type) {
  case 'GET':
   return {
    ...state,
    payload: action.payload
   }
  default:
   return state
 }
}