import { AzureKeyCredential } from "@azure/core-auth";

declare module "@azure-rest/ai-inference" {
  interface ModelClient {
    path(path: string): {
      post(options: any): Promise<any>;
    };
  }
  
  function createClient(endpoint: string, credential: AzureKeyCredential): ModelClient;
  export default createClient;
}
