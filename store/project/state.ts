import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';
import { filterBySlug, filterPerPage, filterProjectsByCareerId } from '../../helpers/helper';

export const listProjectAction = createAsyncAction(
    'listProject/REQUEST',
    'listProject/SUCCESS',
    'listProject/FAILURE'
)<void, Array<any>, Error>();

export const singleProjectAction = createAsyncAction(
    'singleProject/REQUEST',
    'singleProject/SUCCESS',
    'singleProject/FAILURE'
)<void, any, Error>();

export type ListProject = ActionType<typeof listProjectAction>;
export type SingleProject = ActionType<typeof singleProjectAction>;

export type ProjectAction = ListProject | SingleProject;

export type ProjectState = {
    projectList?: Array<any>,
    project?: any,
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
            return { ...state, loadingProjects: false, projectList: action.payload };
        }

        case getType(singleProjectAction.success): {
            return { ...state, project: action.payload };
        }

    }
    return state;
};

export type ProjectDependencies = {
    service: Service;
    storage: StoreJsAPI;
};


export function getProjectList(per_page: number): ThunkAction<void, ProjectState, ProjectDependencies, ProjectAction> {
    return async (dispatch, getState, deps) => {
        await deps.service.fetchData('projects')
        .then(data => {
            const filtered = filterPerPage({
                per_page: per_page,
                list: data
            })
            dispatch(listProjectAction.success(filtered))
        })
        .catch(err => dispatch(listProjectAction.failure(err.message)));
    };
}

export function getProject(slug: string): ThunkAction<void, ProjectState, ProjectDependencies, ProjectAction> {
    return async (dispatch, getState, deps) => {
        await deps.service.fetchData('projects')
        .then(data => {
            const filtered = filterBySlug({
                slug: slug,
                list: data
            })
            dispatch(singleProjectAction.success(filtered))
        })
        .catch(err => dispatch(singleProjectAction.failure(err.message)));
    };
}

export function getProjectsByCareerId(career_id: string): ThunkAction<void, ProjectState, ProjectDependencies, ProjectAction> {
    return async (dispatch, getState, deps) => {
        await deps.service.fetchData('projects')
        .then(data => {
            const filtered = filterProjectsByCareerId({
                career_id: career_id,
                list: data
            })
            dispatch(listProjectAction.success(filtered))
        })
        .catch(err => dispatch(listProjectAction.failure(err.message)));
    };
}


