import APIClient from './ApiClient';

export default abstract class AbstractService {
    protected apiClient: APIClient;

    constructor(apiClient: APIClient) {
        this.apiClient = apiClient;
    }
}
