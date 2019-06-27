import APIClient from './ApiClient';

export default abstract class AbstractService {
    apiClient: APIClient;

    constructor(apiClient: APIClient) {
        this.apiClient = apiClient;
    }
}
