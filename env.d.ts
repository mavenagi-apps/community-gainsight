declare namespace NodeJS {
  export interface ProcessEnv {
    MAVENAGI_APP_ID: string;
    MAVENAGI_APP_SECRET: string;
    GAINSIGHT_DOMAIN: string;
    GAINSIGHT_ACCESS_KEY: string;
    GAINSIGHT_COMPANY_LOOKUP_FIELD: string;
    GAINSIGHT_RELATIONSHIP_LOOKUP_FIELD: string;
  }
}
