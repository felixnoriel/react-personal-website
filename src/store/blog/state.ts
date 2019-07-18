import { ActionType, createAsyncAction, getType, createStandardAction } from 'typesafe-actions';
import Service from '../api/Service';
import { ThunkAction } from 'redux-thunk';
import * as _ from 'lodash';
import { filterBySlug, filterPerPage } from '../../helpers/helper';

export const listBlogAction = createAsyncAction('listBlog/REQUEST', 'listBlog/SUCCESS', 'listBlog/FAILURE')<
    void,
    Array<any>,
    Error
>();

export const singleBlogAction = createAsyncAction('singleBlog/REQUEST', 'singleBlog/SUCCESS', 'singleBlog/FAILURE')<
    void,
    any,
    Error
>();

export type ListBlog = ActionType<typeof listBlogAction>;
export type SingleBlog = ActionType<typeof singleBlogAction>;

export type BlogAction = ListBlog | SingleBlog;

export type BlogState = {
    blogList?: Array<any>;
    blog?: any;
    loadingBlogs: boolean;
};

const initialState: BlogState = {
    loadingBlogs: false,
};

export const blogReducer = (state: BlogState = initialState, action: BlogAction) => {
    switch (action.type) {
        case getType(listBlogAction.request): {
            return { ...state, loadingBlogs: true };
        }

        case getType(listBlogAction.success): {
            return { ...state, loadingBlogs: false, blogList: action.payload };
        }

        case getType(singleBlogAction.success): {
            return { ...state, blog: action.payload };
        }
    }
    return state;
};

export type BlogDependencies = {
    service: Service;
    storage: StoreJsAPI;
};

export function getBlogList(per_page: number): ThunkAction<void, BlogState, BlogDependencies, BlogAction> {
    return async (dispatch, getState, deps) => {
        await deps.service
            .fetchData('blog')
            .then(data => {
                const filtered = filterPerPage({
                    per_page: per_page,
                    list: data,
                });
                dispatch(listBlogAction.success(filtered));
            })
            .catch(err => dispatch(listBlogAction.failure(err.message)));
    };
}

export function getBlog(slug: string): ThunkAction<void, BlogState, BlogDependencies, BlogAction> {
    return async (dispatch, getState, deps) => {
        await deps.service
            .fetchData('blog')
            .then(data => {
                const filtered = filterBySlug({
                    slug: slug,
                    list: data,
                });
                dispatch(singleBlogAction.success(filtered));
            })
            .catch(err => dispatch(singleBlogAction.failure(err.message)));
    };
}
