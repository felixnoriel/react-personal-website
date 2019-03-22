import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';

export const listCareerAction = createAsyncAction(
    'listCareer/REQUEST',
    'listCareer/SUCCESS',
    'listCareer/FAILURE'
)<void, Array<any>, Error>();

export type ListCareer = ActionType<typeof listCareerAction>;

export type CareerAction = ListCareer;

export type CareerState = {
    Careers?: Array<any>,
    loadingCareers: boolean
};

const initialState: CareerState = {
    loadingCareers: false
};

export const careerReducer = (state: CareerState = initialState, action: CareerAction) => {
    switch (action.type) {
        case getType(listCareerAction.request): {
            return { ...state, loadingCareers: true };
        }

        case getType(listCareerAction.success): {
            return { ...state, loadingCareers: false, Careers: action.payload };
        }

    }
    return state;
};

export type CareerDependencies = {
    service: Service;
    storage: StoreJsAPI;
};


export function getIngestRecords(): ThunkAction<void, CareerState, CareerDependencies, CareerAction> {
    return async (dispatch, getState, deps) => {
        // dispatch(listIngestAction.request());
        // const accountId = deps.storage.get('selectedAccount');
        // await deps.ingestService
        //     .fetchIngestRecords(accountId)
        //     .then(data => dispatch(listIngestAction.success(data)))
        //     .catch(err => dispatch(listIngestAction.failure(err.message)));
    };
}
