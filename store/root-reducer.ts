import { combineReducers } from 'redux';
// @ts-ignore
import { reducer as burgerMenu } from 'redux-burger-menu';
import { StateType } from 'typesafe-actions';

import { projectReducer } from './project/state';
import { careerReducer } from './career/state';
import { blogReducer } from './blog/state';

const rootReducer = () =>
    combineReducers({
        project: projectReducer,
        career: careerReducer,
        blog: blogReducer,
        burgerMenu: burgerMenu,
    });

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
export type RootState = StateType<ReturnType<typeof rootReducer>>;

export default rootReducer;
