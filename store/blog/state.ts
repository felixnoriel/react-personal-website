import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';

export const listBlogAction = createAsyncAction(
    'listBlog/REQUEST',
    'listBlog/SUCCESS',
    'listBlog/FAILURE'
)<void, Array<any>, Error>();

export type ListBlog = ActionType<typeof listBlogAction>;

export type BlogAction = ListBlog;

export type BlogState = {
    Blogs?: Array<any>,
    loadingBlogs: boolean
};

const initialState: BlogState = {
    loadingBlogs: false
};

export const blogReducer = (state: BlogState = initialState, action: BlogAction) => {
    switch (action.type) {
        case getType(listBlogAction.request): {
            return { ...state, loadingBlogs: true };
        }

        case getType(listBlogAction.success): {
            return { ...state, loadingBlogs: false, Blogs: action.payload };
        }

    }
    return state;
};

export type BlogDependencies = {
    service: Service;
    storage: StoreJsAPI;
};


export function getIngestRecords(): ThunkAction<void, BlogState, BlogDependencies, BlogAction> {
    return async (dispatch, getState, deps) => {
        // dispatch(listIngestAction.request());
        // const accountId = deps.storage.get('selectedAccount');
        // await deps.ingestService
        //     .fetchIngestRecords(accountId)
        //     .then(data => dispatch(listIngestAction.success(data)))
        //     .catch(err => dispatch(listIngestAction.failure(err.message)));
    };
}
