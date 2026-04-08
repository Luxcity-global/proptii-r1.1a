/**
 * ViewingRequest entity shape — used as the return type for ViewingRequestService and Controller.
 * The actual data is persisted in Cosmos DB or Firestore, not a relational DB.
 * TypeORM decorators are intentionally removed since TypeORM is not active in this project.
 */
export class ViewingRequest {
  id: string;

  property: {
    street: string;
    city: string;
    town: string;
    postcode: string;
  };

  agent: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };

  viewing_date: Date | string;

  viewing_time: string;

  preference: string;

  whatsappNumber: string;

  status: string;

  type?: string;

  createdAt?: string;

  updatedAt?: string;
}
 