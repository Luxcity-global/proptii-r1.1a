import { EmailClient as AzureEmailClient } from '@azure/communication-email';

export class EmailClient extends AzureEmailClient {
  constructor(endpoint, credential) {
    super(endpoint, credential);
  }
} 