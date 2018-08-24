import { combineReducers } from 'redux';
import reducer from './reducer';
import {reducer as burgerMenu} from 'redux-burger-menu';

export default combineReducers({
 burgerMenu,
 reducer
});
