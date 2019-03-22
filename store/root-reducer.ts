import { combineReducers } from 'redux';
import { StateType } from 'typesafe-actions';

import { projectReducer } from './project/state';
import { careerReducer } from './career/state';
import { blogReducer } from './blog/state';

const rootReducer = () =>
    combineReducers({
        project: projectReducer,
        career: careerReducer,
        blog: blogReducer
    });

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
export type RootState = StateType<ReturnType<typeof rootReducer>>;

export default rootReducer;
