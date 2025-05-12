import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BaseController } from '../../shared/base/BaseController';
import { PropertyService } from '../../shared/services/PropertyService';
import { AppError } from '../../shared/middleware/error-handling';
import { withAuth } from '../../shared/middleware/auth';

class PropertyController extends BaseController {
    private propertyService: PropertyService;

    constructor(context: InvocationContext) {
        super(context);
        this.propertyService = new PropertyService();
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
        const propertyId = request.params.id;
        const searchQuery = request.query.get('q');

        if (propertyId) {
            const property = await this.propertyService.getById(propertyId);
            return this.success(property);
        }

        if (searchQuery) {
            const properties = await this.propertyService.search(searchQuery);
            return this.success(properties);
        }

        const properties = await this.propertyService.getAll();
        return this.success(properties);
    }

    private async handlePost(request: HttpRequest): Promise<HttpResponseInit> {
        const propertyData = await request.json();
        const property = await this.propertyService.create(propertyData);
        return this.success(property, 201);
    }

    private async handlePut(request: HttpRequest): Promise<HttpResponseInit> {
        const propertyId = request.params.id;
        if (!propertyId) {
            throw new AppError(400, 'Property ID is required', 'INVALID_REQUEST');
        }

        const propertyData = await request.json();
        const property = await this.propertyService.update(propertyId, propertyData);
        return this.success(property);
    }

    private async handleDelete(request: HttpRequest): Promise<HttpResponseInit> {
        const propertyId = request.params.id;
        if (!propertyId) {
            throw new AppError(400, 'Property ID is required', 'INVALID_REQUEST');
        }

        await this.propertyService.delete(propertyId);
        return this.success({ message: 'Property deleted successfully' });
    }
}

// Register the HTTP trigger
app.http('properties', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'properties/{id?}',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext) => {
        const controller = new PropertyController(context);
        return controller.handle(request, context);
    })
}); 