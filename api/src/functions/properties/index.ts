import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PropertyService } from "../../shared/services/PropertyService";

export class PropertiesController {
    private propertyService: PropertyService;

    constructor() {
        this.propertyService = new PropertyService();
    }

    async createProperty(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json();
            const propertyData = body as any;
            
            const property = await this.propertyService.createProperty(propertyData);
            
            return {
                status: 201,
                body: JSON.stringify(property)
            };
        } catch (error) {
            context.error('Error creating property:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to create property' })
            };
        }
    }

    async updateProperty(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const propertyId = request.params.propertyId;
            const body = await request.json();
            const propertyData = body as any;
            
            const property = await this.propertyService.updateProperty(propertyId, propertyData);
            
            return {
                status: 200,
                body: JSON.stringify(property)
            };
        } catch (error) {
            context.error('Error updating property:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to update property' })
            };
        }
    }

    async getProperty(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const propertyId = request.params.propertyId;
            const property = await this.propertyService.getPropertyById(propertyId);
            
            return {
                status: 200,
                body: JSON.stringify(property)
            };
        } catch (error) {
            context.error('Error getting property:', error);
            return {
                status: 404,
                body: JSON.stringify({ error: 'Property not found' })
            };
        }
    }

    async getAllProperties(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const properties = await this.propertyService.getAll();
            
            return {
                status: 200,
                body: JSON.stringify(properties)
            };
        } catch (error) {
            context.error('Error getting properties:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to get properties' })
            };
        }
    }

    async deleteProperty(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const propertyId = request.params.propertyId;
            await this.propertyService.deleteProperty(propertyId);
            
            return {
                status: 204
            };
        } catch (error) {
            context.error('Error deleting property:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to delete property' })
            };
        }
    }
}

const controller = new PropertiesController();

app.http('properties', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getAllProperties(request, context);
        } else if (request.method === 'POST') {
            return controller.createProperty(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
});

app.http('properties/{propertyId}', {
    methods: ['GET', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getProperty(request, context);
        } else if (request.method === 'PUT') {
            return controller.updateProperty(request, context);
        } else if (request.method === 'DELETE') {
            return controller.deleteProperty(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
}); 