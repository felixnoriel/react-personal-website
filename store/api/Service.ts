import AbstractService from './AbstractService';

const IngestAPIUrl = '/ingest';

export default class Service extends AbstractService {
    fetchIngestRecords(accountId: string): Promise<Array<any>> {
        return this.apiClient
            .makeRequest({
                url: `${IngestAPIUrl}/records`,
                method: 'GET',
            })
            .then((res: any) => res.data.data as Array<any>);
    }
}
