declare global {
  interface AppSettings {
    domain: string;
    accessKey: string;
    companyLookupField: string;
    relationshipLookupField: string
  }
}

export {};
