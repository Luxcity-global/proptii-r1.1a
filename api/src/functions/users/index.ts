import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BaseController } from '../../shared/base/BaseController';
import { UserService } from '../../shared/services/UserService';
import { AppError } from '../../shared/middleware/error-handling';
import { withAuth } from '../../shared/middleware/auth';

class UserController extends BaseController {
    private userService: UserService;

    constructor(context: InvocationContext) {
        super(context);
        this.userService = new UserService();
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
        const userId = request.params.id;
        if (userId) {
            const user = await this.userService.getById(userId);
            return this.success(user);
        }

        const users = await this.userService.getAll();
        return this.success(users);
    }

    private async handlePost(request: HttpRequest): Promise<HttpResponseInit> {
        const userData = await request.json();
        const user = await this.userService.create(userData);
        return this.success(user, 201);
    }

    private async handlePut(request: HttpRequest): Promise<HttpResponseInit> {
        const userId = request.params.id;
        if (!userId) {
            throw new AppError(400, 'User ID is required', 'INVALID_REQUEST');
        }

        const userData = await request.json();
        const user = await this.userService.update(userId, userData);
        return this.success(user);
    }

    private async handleDelete(request: HttpRequest): Promise<HttpResponseInit> {
        const userId = request.params.id;
        if (!userId) {
            throw new AppError(400, 'User ID is required', 'INVALID_REQUEST');
        }

        await this.userService.delete(userId);
        return this.success({ message: 'User deleted successfully' });
    }
}

// Register the HTTP trigger
app.http('users', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'users/{id?}',
    handler: withAuth(async (request: HttpRequest, context: InvocationContext) => {
        const controller = new UserController(context);
        return controller.handle(request, context);
    })
}); 