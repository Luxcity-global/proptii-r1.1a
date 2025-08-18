import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ViewingService } from "../../shared/services/ViewingService";

export class ViewingsController {
    private viewingService: ViewingService;

    constructor() {
        this.viewingService = new ViewingService();
    }

    async createViewing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json();
            const viewingData = body as any;
            
            const viewing = await this.viewingService.createViewing(viewingData);
            
            return {
                status: 201,
                body: JSON.stringify(viewing)
            };
        } catch (error) {
            context.error('Error creating viewing:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to create viewing' })
            };
        }
    }

    async updateViewing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const viewingId = request.params.viewingId;
            const body = await request.json();
            const viewingData = body as any;
            
            const viewing = await this.viewingService.updateViewing(viewingId, viewingData);
            
            return {
                status: 200,
                body: JSON.stringify(viewing)
            };
        } catch (error) {
            context.error('Error updating viewing:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to update viewing' })
            };
        }
    }

    async getViewing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const viewingId = request.params.viewingId;
            const viewing = await this.viewingService.getViewingById(viewingId);
            
            return {
                status: 200,
                body: JSON.stringify(viewing)
            };
        } catch (error) {
            context.error('Error getting viewing:', error);
            return {
                status: 404,
                body: JSON.stringify({ error: 'Viewing not found' })
            };
        }
    }

    async getAllViewings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const viewings = await this.viewingService.getAll();
            
            return {
                status: 200,
                body: JSON.stringify(viewings)
            };
        } catch (error) {
            context.error('Error getting viewings:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to get viewings' })
            };
        }
    }

    async deleteViewing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const viewingId = request.params.viewingId;
            await this.viewingService.deleteViewing(viewingId);
            
            return {
                status: 204
            };
        } catch (error) {
            context.error('Error deleting viewing:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to delete viewing' })
            };
        }
    }
}

const controller = new ViewingsController();

app.http('viewings', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getAllViewings(request, context);
        } else if (request.method === 'POST') {
            return controller.createViewing(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
});

app.http('viewings/{viewingId}', {
    methods: ['GET', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getViewing(request, context);
        } else if (request.method === 'PUT') {
            return controller.updateViewing(request, context);
        } else if (request.method === 'DELETE') {
            return controller.deleteViewing(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
}); 