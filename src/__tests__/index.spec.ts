import hooks from '../index';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MavenAGIClient } from 'mavenagi';

// Mock the MavenAGI client
vi.mock('mavenagi', () => ({
  MavenAGIClient: vi.fn(),
}));

const { preInstall, postInstall, executeAction } = hooks;

// Test constants
const TEST_AGENT_ID = 'test-agent-id';
const TEST_ORGANIZATION_ID = 'test-org-id';

// Use environment variables with fallbacks for testing
const GAINSIGHT_DOMAIN = process.env.GAINSIGHT_DOMAIN || 'test-domain';
const GAINSIGHT_ACCESS_KEY = process.env.GAINSIGHT_ACCESS_KEY || 'test-access-key';
const GAINSIGHT_COMPANY_LOOKUP_FIELD = process.env.GAINSIGHT_COMPANY_LOOKUP_FIELD || 'Name';
const GAINSIGHT_RELATIONSHIP_LOOKUP_FIELD = process.env.GAINSIGHT_RELATIONSHIP_LOOKUP_FIELD || 'Name';

const TEST_SETTINGS = {
  domain: GAINSIGHT_DOMAIN,
  accessKey: GAINSIGHT_ACCESS_KEY,
  companyLookupField: GAINSIGHT_COMPANY_LOOKUP_FIELD,
  relationshipLookupField: GAINSIGHT_RELATIONSHIP_LOOKUP_FIELD
};

const INVALID_SETTINGS = {
  domain: 'invalid-domain',
  accessKey: 'invalid-access-key',
  companyLookupField: 'Name',
  relationshipLookupField: 'Name'
};

describe('Community Gainsight App', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fresh mock for each test
    const mockCreateOrUpdate = vi.fn().mockResolvedValue({});
    (MavenAGIClient as any).mockImplementation(() => ({
      actions: {
        createOrUpdate: mockCreateOrUpdate,
      },
    }));
  });

  describe('preInstall', () => {
    it('should succeed with valid API credentials', async () => {
      await expect(
        preInstall({
          agentId: TEST_AGENT_ID,
          organizationId: TEST_ORGANIZATION_ID,
          settings: TEST_SETTINGS,
        })
      ).resolves.not.toThrow();
    });

    it('should fail with invalid API credentials', async () => {
      await expect(
        preInstall({
          agentId: TEST_AGENT_ID,
          organizationId: TEST_ORGANIZATION_ID,
          settings: INVALID_SETTINGS,
        })
      ).rejects.toThrow();
    });
  });

  describe('postInstall', () => {
    it('should register both lookup actions', async () => {
      await postInstall({
        agentId: TEST_AGENT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        settings: TEST_SETTINGS,
      });

      // Get the mock instance
      const mockInstance = (MavenAGIClient as any).mock.results[0].value;
      expect(mockInstance.actions.createOrUpdate).toHaveBeenCalledTimes(2);
      
      // Check first action (lookup-RelationshipDetails)
      expect(mockInstance.actions.createOrUpdate).toHaveBeenNthCalledWith(1, {
        actionId: {
          referenceId: 'lookup-RelationshipDetails',
        },
        name: 'lookupRelationshipDetails',
        description: expect.stringContaining('looks up Relationship details in Gainsight'),
        userInteractionRequired: true,
        userFormParameters: [
          {
            description: 'The value you want to search for specific for relationships.',
            id: 'relSearchValue',
            label: 'Search value for the Relationship',
            required: true,
          },
        ],
        buttonName: 'Submit',
      });

      // Check second action (lookup-CompanyDetails)
      expect(mockInstance.actions.createOrUpdate).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          actionId: {
            referenceId: 'lookup-CompanyDetails',
          },
          name: 'lookupCompanyDetails',
          description: expect.stringContaining('looks up Company details in Gainsight'),
          userInteractionRequired: true,
          userFormParameters: [
            {
              description: 'The value you want to search for specific to companies.',
              id: 'compSearchValue',
              label: 'Search value for the Relationship', // Note: this appears to be a copy-paste error in the original code
              required: true,
            },
          ],
          buttonName: 'Submit',
        })
      );
    });
  });

  describe('executeAction', () => {
    it('should return undefined for unrecognized actionId', async () => {
      const result = await executeAction({
        agentId: TEST_AGENT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        actionId: 'unknown-action',
        parameters: {},
        user: 'test-user',
        settings: TEST_SETTINGS,
      });

      expect(result).toBeUndefined();
    });

    it('should successfully execute lookup-RelationshipDetails action', async () => {
      const result = await executeAction({
        agentId: TEST_AGENT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        actionId: 'lookup-RelationshipDetails',
        parameters: {
          relSearchValue: 'Test Relationship',
        },
        user: 'test-user',
        settings: TEST_SETTINGS,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // The result should be a JSON string containing the mocked data
      const parsedResult = JSON.parse(result as string);
      expect(parsedResult).toEqual([
        {
          GSID: 'test-gsid',
          Name: 'Test Relationship',
          CompanyId: 'test-company-id'
        }
      ]);
    });

    it('should successfully execute lookup-CompanyDetails action', async () => {
      const result = await executeAction({
        agentId: TEST_AGENT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        actionId: 'lookup-CompanyDetails',
        parameters: {
          compSearchValue: 'Test Company',
        },
        user: 'test-user',
        settings: TEST_SETTINGS,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // The result should be a JSON string containing the mocked data
      const parsedResult = JSON.parse(result as string);
      expect(parsedResult).toEqual([
        {
          GSID: 'test-company-gsid',
          Name: 'Test Company',
          SfdcAccountId: 'test-sfdc-id'
        }
      ]);
    });

    it('should handle relationship lookup with missing parameters', async () => {
      const result = await executeAction({
        agentId: TEST_AGENT_ID,
        organizationId: TEST_ORGANIZATION_ID,
        actionId: 'lookup-RelationshipDetails',
        parameters: {
          relSearchValue: null,
        },
        user: 'test-user',
        settings: TEST_SETTINGS,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Should still return the mocked data (API call is made with null value)
      const parsedResult = JSON.parse(result as string);
      expect(parsedResult).toEqual([
        {
          GSID: 'test-gsid',
          Name: 'Test Relationship',
          CompanyId: 'test-company-id'
        }
      ]);
    });

    it('should handle API errors gracefully', async () => {
      await expect(
        executeAction({
          agentId: TEST_AGENT_ID,
          organizationId: TEST_ORGANIZATION_ID,
          actionId: 'lookup-RelationshipDetails',
          parameters: {
            relSearchValue: 'Test Relationship',
          },
          user: 'test-user',
          settings: INVALID_SETTINGS, // This will trigger the 401 error
        })
      ).rejects.toThrow('makeGainsightAPICall:: ERROR::');
    });
  });
}); 