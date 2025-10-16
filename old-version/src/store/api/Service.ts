import AbstractService from './AbstractService';

export default class Service extends AbstractService {
    public async fetchData(posttype: string): Promise<any[]> {
        try {
            const data = await this.apiClient
                .makeRequest({
                    method: 'GET',
                    url: `/static/${posttype}.json`,
                })
                .then((res: any) => res.data as any[]);
            return data;
        } catch (err) {
            console.log('error fetchData', err);
            return err;
        }
    }
}
