## Gainsight Demo

This app prompts the user for input and then searches for either a Gainsight Relationship or Gainsight Company record and returns some details back to the user.

1. Preinstall checks to see if the accesskey provided is valid.
2. Postinstall created 2 actions for searching against specific Gainsight tables.
3. Executeaction passes app settings and user input to the API call and returns the the record details.

## Actions

**lookupRelationshipDetails** (`lookup-RelationshipDetails`)
-Looks up a Gainsight Relationship based off the user input provided.
-Required parameters:

- `relSearchValue` The value the user wants to search for.

**lookupCompanyDetails** (`lookup-CompanyDetails`)
-Looks up a Gainsight Company based off the user input provided.
-Required parameters:

- `compSearchValue` The value the user wants to search for.

Both actions return details about the record(s) being search for and presents it to the user.

## Setup

To use this app you need to provide:

- domain: The subdomain of the Gainsight instance you want to connect to. https://<domain>.gainsightclound.com
- accessKey: API key from the Gainsight domain above.
- companyLookupField: The Gainsight Company **Field Name** of the field you want to use to lookup the record.
- relationshipLookupField: The Gainsight Relationship **Field Name** of the field you want to use to lookup the record.

## Dependencies

This app uses the following external libraries:

- `mavenagi`: A client library for interacting with the Maven AGI system
- A Gainsight instance which ahs the API enabled.

## Note to Developers

This app is designed to be an example. If you know of a better way to code something within this app please do so!

If you have any questions please reachout on our Discord!
Maven Discord:
https://discord.mavenagi.com/

We hope to see you there!

## Maven Default Readme Notes

This is a Maven App which uses [Next.js](https://nextjs.org/) bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Every time code is deployed either via the App Studio or by commiting to this repo, the Maven App will be updated and available at your app url:

`https://<appId>.onmaven.app`

You can start editing the page by modifying `app/page.tsx`.

To edit Maven App hooks modify `src/index.ts`.

## Learn More

To learn more about Maven, check out our [documentation](http://developers.mavenagi.com).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.
