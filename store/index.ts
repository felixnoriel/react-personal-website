import createStore, { RootServiceDependencies } from './store';
export type RootServiceDependencies = RootServiceDependencies;
export default createStore;

import { RootState } from './root-reducer';
export type RootState = RootState;

export { default as rootReducer } from './root-reducer';
