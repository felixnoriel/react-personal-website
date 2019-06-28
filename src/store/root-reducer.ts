import { combineReducers } from 'redux';
// @ts-ignore
import { reducer as burgerMenu } from 'redux-burger-menu';
import { StateType } from 'typesafe-actions';

import { blogReducer } from './blog/state';
import { careerReducer } from './career/state';
import { projectReducer } from './project/state';

const rootReducer = () =>
    combineReducers({
        project: projectReducer,
        career: careerReducer,
        blog: blogReducer,
        burgerMenu,
    });

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
export type RootState = StateType<ReturnType<typeof rootReducer>>;

export default rootReducer;
