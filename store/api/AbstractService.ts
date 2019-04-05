import APIClient from './APIClient';

export default abstract class AbstractService {
    apiClient: APIClient;

    constructor(apiClient: APIClient) {
        this.apiClient = apiClient;
    }
}
