import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { config } from 'dotenv';

// Load environment variables using dotenv's default behavior
// This will automatically look for .env, .env.local, .env.production, etc.
config();

// Get domain from environment variables or use default
const TEST_DOMAIN = process.env.GAINSIGHT_DOMAIN || 'test-domain';

// Mock server for Gainsight API
const server = setupServer(
  // Mock preinstall test endpoint
  http.post(`https://${TEST_DOMAIN}.gainsightcloud.com/v1/users/services/list`, () => {
    return HttpResponse.json({
      data: {
        records: [
          {
            GSID: 'test-gsid'
          }
        ]
      }
    });
  }),

  // Mock relationship lookup endpoint
  http.post(`https://${TEST_DOMAIN}.gainsightcloud.com/v1/data/objects/query/relationship`, () => {
    return HttpResponse.json({
      data: {
        records: [
          {
            GSID: 'test-gsid',
            Name: 'Test Relationship',
            CompanyId: 'test-company-id'
          }
        ]
      }
    });
  }),

  // Mock company lookup endpoint
  http.post(`https://${TEST_DOMAIN}.gainsightcloud.com/v1/data/objects/query/Company`, () => {
    return HttpResponse.json({
      data: {
        records: [
          {
            GSID: 'test-company-gsid',
            Name: 'Test Company',
            SfdcAccountId: 'test-sfdc-id'
          }
        ]
      }
    });
  }),

  // Mock failed authentication - catch all for invalid domain
  http.post('https://invalid-domain.gainsightcloud.com/*', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());