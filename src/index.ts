/*
  Throughout this code I use console.info(); for debugging. To view the logs go to
  https://developers.mavenagi.com/en/apps/<app name>/logs. The website seem to refresh every minute
  or so which means that if you dont see your output right away wait a minute and refresh the page.
  As of writing this the refresh button on the logs page doesnt seem to work so I have been refreshing 
  the page vs using that button.

  Helpful Maven documentation:
  https://developers.mavenagi.com/docs/api-reference/api-reference/actions/working-with-actions

  Have questions? Need help? Want to give us feedback? Join our discord and drop us a line and we
  will give you the helping hand you are looking for.
  Maven Discord:
  https://discord.mavenagi.com/ <-- you will have to create an account if you dont already have one.

  Looking forward to seeing you there!
*/
import { MavenAGIClient } from 'mavenagi';
let GSACCESSKEY: string;
let BASEURL: string;

/*
Builds the URL for the API to call.
endpoint is passed in so that it cant be dynamic. There is a case to be made to hard code some of the endpoints
since they are mostly static but for simplicity we will pass in the endpoints as we go.
*/
function getURL(endpoint: string) {
  return `${BASEURL}/${endpoint}`;
} //end getURL

/*
Creates the body of the API request. Depending on which endpoint you call you will have to modify what the body
contains. 
See the Gainsight documentation for further details: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs
*/
async function createRequestBodyString(
  endpointType: string,
  lookupField: string,
  lookupValue: any
) {
  let body;

  switch(endpointType) {
    case "preinstall":
      //used to verify the the accessToken provided.
      body = {
        includeTotal: false,
        limit: 1,
        page: 0,
        select: ['GSID'],
      };
      break;
      
    case "relationship":
      //used to search for a relationship record.
      body = {
        select: ['Name', 'GSID', 'CompanyId'],
        where: {
          conditions: [
            {
              name: lookupField,
              alias: 'A',
              value: [lookupValue],
              operator: 'EQ',
            },
          ],
          expression: 'A',
        },
        limit: 100,
        offset: 0,
      };
      break;

    case "company":
      //used to search for a company record.
      body = {
        select: ['Name', 'SfdcAccountId', 'GSID'],
        where: {
          conditions: [
            {
              name: lookupField,
              alias: 'A',
              value: [lookupValue],
              operator: 'EQ',
            },
          ],
          expression: 'A',
        },
        limit: 100,
        offset: 0,
      };
      break;

    default:
      console.error("Unknown request body type");
      body = {};
  } 
  
  return JSON.stringify(body);
} //end creatRequestBody

const endpointTypeToPathMapping : { [key: string]: string } = {
  preinstall: "v1/users/services/list",
  relationship: "v1/data/objects/query/relationship",
  company: "v1/data/objects/query/Company"
};
/*
Function that actually makes the API call. This should be dynamic enough to work in most cases if not modify this for
your use case.
Since in this demo we only look up records the method can be set to POST but if you need to update or delete records 
you will need to modify the method. 

See Gainsight API to determine which method to use: https://support.gainsight.com/gainsight_nxt/API_and_Developer_Docs
 */
async function makeGainsightAPICall(
  endpointType: string,
  lookupField: string,
  lookupValue: any
) {
  const endpointPath = endpointTypeToPathMapping[endpointType];
  const URL: string = getURL(endpointPath);
  const body = await createRequestBodyString(endpointType, lookupField, lookupValue);

  try {
    console.info('makeGainsightAPICall:: URL:: ' + URL);
    console.info('makeGainsightAPICall:: body:: ' + body);
    let GSResponse = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccessKey: GSACCESSKEY,
      },
      body: body,
    }); //end fetch

    let GSResponseJSON = await GSResponse.json();

    /*
  These are two ways to handle Gainsight API errors:

  1. A boolean response property named result; if false, the call failed. This check is commented out below. 
  Note that result may be true but the result may be an empty array if no search results were found.
  2. The boolean ok property tells us whether the HTTP status fell within a success range (200-299). The status
  property reports the actual status. 

  We currently use the ok property check.
   */
    if (!GSResponse.ok) {
      throw new Error(
        'makeGainsightAPICall:: ERROR:: ' + JSON.stringify(GSResponseJSON)
      );
    } //end if

    /*
    if (GSResponseJSON.result === false) {
      throw new Error(
        'makeGainsightAPICall:: ERROR:: ' + JSON.stringify(GSResponseJSON)
      );
    }//end if
    */

    console.info(
      'makeGainsightAPICall:: body:: ' + JSON.stringify(GSResponseJSON)
    );
    return GSResponseJSON;
  } catch (error) {
    throw error;
  } //end try-catch
} //end makeGainsightAPICall

/*
I use the preInstall function to verify the accessKey provided in the settings is valid. I specifically call the users endpoint
and have it return 1 GSID. The thought behind this is that there will always be at least 1 user in the Gainsight instance your
got the accessKey from because you need to log in to get the key. We don't care about the results we just care if the call failed.
If it fails we error out; if it doesn't then we proceed with the install.

See Maven documentation on preinstall for actions:
https://developers.mavenagi.com/docs/api-reference/api-reference/actions/working-with-actions#handling-actions-a-serverless-maven-app
*/

export default {
  async preInstall({
    organizationId,
    agentId,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    console.info(
      '------------------- START OF DEMO GAINSIGHT APP:: PREINSTALL -------------------'
    );
    GSACCESSKEY = settings.accessKey;
    BASEURL = `https://${settings.domain}.gainsightcloud.com`;
    await makeGainsightAPICall('preinstall', '', '');

    console.info(
      '------------------- END OF DEMO GAINSIGHT APP:: PREINSTALL -------------------'
    );
  }, //end preInstall

  /*
  PostInstall is where I create the actions for this app. In this app there are two actions, 'lookup-RelationshipDetails' and
  'lookup-CompanyDetail'. Each of them are set to present a form to the user to collect information so it can be used in the
  API call. In the next function I have an example of how to access those parameters.

  Much like this app, apps can have more than one action. To specifc multiple actions call 'await client.actions.createOrUpdate()'
  for each actions.

  An action can prompt the user for more than one parameter as well. This is not demonstrated in this app.

  If you need help with creating a description that works reach out to us on our discord! Invite Link at the top of the page.

  See Maven documentation for 'client.actions.createOrUpdate':
  https://developers.mavenagi.com/docs/api-reference/api-reference/actions/create-or-update
  */
  async postInstall({
    organizationId,
    agentId,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    console.info(
      '------------------- START OF DEMO GAINSIGHT APP:: POSTINSTALL -------------------'
    );
    const client = new MavenAGIClient({
      organizationId,
      agentId,
    });
    
    //Relationship details action.
    await client.actions.createOrUpdate({
      actionId: {
        referenceId: 'lookup-RelationshipDetails',
      },
      name: 'lookupRelationshipDetails',
      description: `This action looks up Relationship details in Gainsight using their API and provide details back to the user.
      Show an input form to collect the users *search criteria (relSearchValue)* which will be used in the API call.
      The user must supply a value for *relSearchValue*.
      **Response Instructions for looking up a Relationship**
      Display the *Relationship Name (Name)*, *GSID (GISD)* and *Company Id (CompanyId)* from the results of the API call back to the user.
      **Ways a user can ask to query a relationship**
      - 'I would like to get my relationship details.'
      - 'How do I find my relationship details.'
      - 'get relationship details.'
      - 'I need to lookup details on my relationship.'
      - 'What the best way to get relationship details?'`,
      userInteractionRequired: true,
      userFormParameters: [
        {
          description:
            'The value you want to search for specific for relationships.',
          id: 'relSearchValue',
          label: 'Search value for the Relationship',
          required: true,
        },
      ],
      buttonName: 'Submit',
    });

    console.info('INTRALINKS:: lookup-RelationshipDetails action created');

    //Company details action.
    await client.actions.createOrUpdate({
      actionId: {
        referenceId: 'lookup-CompanyDetails',
      },
      name: 'lookupCompanyDetails',
      description: `This action looks up Company details in Gainsight using their API and provide details back to the user.
      Show an input form to collect the users *search criteria (lookupCompanyDetails)* which will be used in the API call.
      The user must supply a value for *lookupCompanyDetails*.
      **Response Instructions for looking up a company**
      Display the *Company Name (Name)*, *Salesforce Account ID (sfdcAccountId)* and *GSID (GSID)* from the results of the API call back to the user.
      **Ways a user can ask to query a company**
      - 'I would like to get my company details.'
      - 'How do I find my company details.'
      - 'get company details.'
      - 'I need to lookup details on my company.'
      - 'What the best way to get company details?'`,
      userInteractionRequired: true,
      userFormParameters: [
        {
          description:
            'The value you want to search for specific to companies.',
          id: 'compSearchValue',
          label: 'Search value for the Relationship',
          required: true,
        },
      ],
      buttonName: 'Submit',
    });

    console.info('INTRALINKS:: lookup-CompanyDetails action created');
    console.info(
      '------------------- END OF DEMO GAINSIGHT APP:: POSTINSTALL -------------------'
    );
  }, //end postInstall

  /*
  The executeAction is the code the runs when the action(s) above are called. In this case I show how to reference the settings values you set on app
  install, how to access the parameters you declared in the actions and how to execute different code for a specific action if your app has multiple 
  actions.

  See Maven documentation for executeAction **Including all the parameters possible to pass in**:
  https://developers.mavenagi.com/docs/documentation/app-development/interface#executeaction

   */
  async executeAction({
    organizationId,
    agentId,
    actionId,
    parameters,
    user,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    actionId: string;
    parameters: Record<string, any>;
    user: any;
    settings: AppSettings;
  }) {
    console.info(
      '------------------- START OF DEMO GAINSIGHT APP:: EXECUTEACTION -------------------'
    );

    /*
    As you can see in the function definition we have 'settings' being passed into this function and we declare that they are of type AppSettings. Doing
    that allows use to use dot notation to specify which app setting parameter we want to access. If you look below where 'GSACCESSKEY' and 'BASEURL'
    you can see how to use settings to directly set a variable or to be used in a string to set a variable. 
    */
    GSACCESSKEY = settings.accessKey;
    BASEURL = `https://${settings.domain}.gainsightcloud.com`;
    let result;

    /*
    This if else if statement is how you would execute specific code for certain actions. As you can see we use the actionId parameter that was passed
    into the function and we check to see if that is equal to the referenceId of the action we setup in the post install. This should be fairly 
    straightforward.
    */
    if (actionId === 'lookup-RelationshipDetails') {
      console.info('executeAction:: lookup-RelationshipDetails action called.');
      /*
      In the call makeGainsightAPICall you can see an instance of how we access the paramteres we listed in the actions. Much like with accessing
      settings you can use dot notation to access the action parameters, IE. paramteres.value. To specify the action paramter youw ant to pass refer
      to the one of the id field's under "userFormParameters" for the action. 
      */
      result = await makeGainsightAPICall(
        'relationship',
        settings.relationshipLookupField,
        parameters.relSearchValue
      );
    } else if (actionId === 'lookup-CompanyDetails') {
      console.info('executeAction:: lookup-CompanyDetails action called.');
      //Another example of using setting an parmaters.
      result = await makeGainsightAPICall(
        'company',
        settings.companyLookupField,
        parameters.compSearchValue
      );
    } //end else if

    console.info('executeAction:: result:: ' + JSON.stringify(result));
    console.info(
      '------------------- END OF DEMO GAINSIGHT APP:: EXECUTEACTION -------------------'
    );
    /*
    When you return something back from the app you can do it in 2 ways (that I know of there may be more). The first is what is happening below. You pass back
    the data as is and then in the description of the action you tell the bot what to do with the data.
    
    The second if to return an instruction to the bot like this:
    return `Tell the user their orderId is ${orderId} and thank them for their business.`;
    This option will require some tuning to get it to be consistent.
    */
    // Handle undefined result (unknown actions)
    if (!result) {
      return undefined;
    }
    return JSON.stringify(result.data.records);
  }, //end executeAction
};
