import AbstractService from './AbstractService';

export default class Service extends AbstractService {
    fetchData(posttype: string): Promise<Array<any>> {
        return this.apiClient
            .makeRequest({
                url: `${posttype}.json`,
                method: 'GET',
            })
            .then((res: any) => res.data as Array<any>);
    }
}
