import AbstractService from './AbstractService';

export default class Service extends AbstractService {
    async fetchData(posttype: string): Promise<Array<any>> {
        try {
            const data = await this.apiClient
                .makeRequest({
                    url: `/static/${posttype}.json`,
                    method: 'GET',
                })
                .then((res: any) => res.data as Array<any>);
            return data;
        } catch (err) {
            console.log('error fetchData', err);
            return err;
        }
    }
}
