import { callExternalApi } from './nodejs-external-api-client';

describe('externalApiClient', () => {
  it('should work', async () => {
    const result = await callExternalApi();
    expect(result).toEqual('external-api-call');
  });
});
