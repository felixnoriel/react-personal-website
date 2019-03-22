import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';

export const listProjectAction = createAsyncAction(
    'listProject/REQUEST',
    'listProject/SUCCESS',
    'listProject/FAILURE'
)<void, Array<any>, Error>();

export type ListProject = ActionType<typeof listProjectAction>;

export type ProjectAction = ListProject;

export type ProjectState = {
    projects?: Array<any>,
    loadingProjects: boolean
};

const initialState: ProjectState = {
    loadingProjects: false
};

export const projectReducer = (state: ProjectState = initialState, action: ProjectAction) => {
    switch (action.type) {
        case getType(listProjectAction.request): {
            return { ...state, loadingProjects: true };
        }

        case getType(listProjectAction.success): {
            return { ...state, loadingProjects: false, projects: action.payload };
        }

    }
    return state;
};

export type ProjectDependencies = {
    service: Service;
    storage: StoreJsAPI;
};


export function getIngestRecords(): ThunkAction<void, ProjectState, ProjectDependencies, ProjectAction> {
    return async (dispatch, getState, deps) => {
        // dispatch(listIngestAction.request());
        // const accountId = deps.storage.get('selectedAccount');
        // await deps.ingestService
        //     .fetchIngestRecords(accountId)
        //     .then(data => dispatch(listIngestAction.success(data)))
        //     .catch(err => dispatch(listIngestAction.failure(err.message)));
    };
}
