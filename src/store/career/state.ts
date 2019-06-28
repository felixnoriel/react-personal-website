import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';
import { filterBySlug, filterPerPage, filterProjectsByCareerId } from '../../helpers/helper';

export const listCareerAction = createAsyncAction('listCareer/REQUEST', 'listCareer/SUCCESS', 'listCareer/FAILURE')<
    void,
    any[],
    Error
>();

export const singleCareerAction = createAsyncAction(
    'singleCareer/REQUEST',
    'singleCareer/SUCCESS',
    'singleCareer/FAILURE'
)<void, any, Error>();

export type ListCareer = ActionType<typeof listCareerAction>;
export type SingleCareer = ActionType<typeof singleCareerAction>;

export type CareerAction = ListCareer | SingleCareer;

export type CareerState = {
    careerList?: any[];
    career?: any;
    loadingCareers: boolean;
};

const initialState: CareerState = {
    loadingCareers: false,
};

export const careerReducer = (state: CareerState = initialState, action: CareerAction) => {
    switch (action.type) {
        case getType(listCareerAction.request): {
            return { ...state, loadingCareers: true };
        }
        case getType(listCareerAction.success): {
            return { ...state, loadingCareers: false, careerList: action.payload };
        }
        case getType(singleCareerAction.success): {
            return { ...state, career: action.payload };
        }
    }
    return state;
};

export type CareerDependencies = {
    service: Service;
    storage: StoreJsAPI;
};

export function getCareerList(per_page: number): ThunkAction<void, CareerState, CareerDependencies, CareerAction> {
    return async (dispatch, getState, deps) => {
        await deps.service
            .fetchData('career')
            .then(data => {
                const filtered = filterPerPage({
                    per_page: per_page,
                    list: data,
                });
                dispatch(listCareerAction.success(filtered));
            })
            .catch(err => dispatch(listCareerAction.failure(err.message)));
    };
}

export function getCareer(slug: string): ThunkAction<void, CareerState, CareerDependencies, CareerAction> {
    return async (dispatch, getState, deps) => {
        await deps.service
            .fetchData('career')
            .then(data => {
                const filtered = filterBySlug({
                    slug: slug,
                    list: data,
                });
                dispatch(singleCareerAction.success(filtered));
            })
            .catch(err => dispatch(singleCareerAction.failure(err.message)));
    };
}
