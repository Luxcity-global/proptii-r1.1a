import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BaseController } from '../../shared/base/BaseController';
import { ViewingService } from '../../shared/services/ViewingService';
import { AppError } from '../../shared/middleware/error-handling';
import { withAuth } from '../../shared/middleware/auth';

class ViewingController extends BaseController {
    private viewingService: ViewingService;

    constructor(context: InvocationContext) {
        super(context);
        this.viewingService = new ViewingService();
    }

    async handle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            switch (request.method) {
                case 'GET':
                    return this.handleGet(request);
                case 'POST':
                    return this.handlePost(request);
                case 'PUT':
                    return this.handlePut(request);
                case 'DELETE':
                    return this.handleDelete(request);
                default:
                    throw new AppError(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
            }
        } catch (error) {
            return this.error(error as Error);
        }
    }

    private async handleGet(request: HttpRequest): Promise<HttpResponseInit> {
        const viewingId = request.params.id;
        const propertyId = request.query.get('propertyId');
        const userId = request.query.get('userId');

        if (viewingId) {
            const viewing = await this.viewingService.getById(viewingId);
            return this.success(viewing);
        }

        if (propertyId) {
            const viewings = await this.viewingService.getByPropertyId(propertyId);
            return this.success(viewings);
        }

        if (userId) {
            const viewings = await this.viewingService.getByUserId(userId);
            return this.success(viewings);
        }

        const viewings = await this.viewingService.getAll();
        return this.success(viewings);
    }

    private async handlePost(request: HttpRequest): Promise<HttpResponseInit> {
        const viewingData = await request.json();
        const viewing = await this.viewingService.create(viewingData);
        return this.success(viewing, 201);
    }

    private async handlePut(request: HttpRequest): Promise<HttpResponseInit> {
        const viewingId = request.params.id;
        if (!viewingId) {
            throw new AppError(400, 'Viewing ID is required', 'INVALID_REQUEST');
        }

        const viewingData = await request.json();
        const viewing = await this.viewingService.update(viewingId, viewingData);
        return this.success(viewing);
    }

    private async handleDelete(request: HttpRequest): Promise<HttpResponseInit> {
        const viewingId = request.params.id;
        if (!viewingId) {
            throw new AppError(400, 'Viewing ID is required', 'INVALID_REQUEST');
        }

        await this.viewingService.delete(viewingId);
        return this.success({ message: 'Viewing deleted successfully' });
    }
}

// Register the HTTP trigger
app.http('viewings', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'viewings/{id?}',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext) => {
        const controller = new ViewingController(context);
        return controller.handle(request, context);
    })
}); 