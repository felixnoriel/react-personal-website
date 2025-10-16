import axios, { AxiosRequestConfig, AxiosPromise, AxiosInstance } from 'axios';
import { Store } from 'redux';
import { RootState } from '../root-reducer';
export default class APIClient {
    private axiosInstance: AxiosInstance;

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({
            baseURL: baseURL,
        });
    }

    public attachStore(store: Store<RootState>) {
        // store.subscribe(() => {});
    }

    public makeRequest(req: AxiosRequestConfig): AxiosPromise {
        return this.axiosInstance(req);
    }
}
