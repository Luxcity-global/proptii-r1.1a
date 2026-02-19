import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { UserService } from "../../shared/services/UserService";

export class UsersController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async createUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const body = await request.json();
            const userData = body as any;
            
            const user = await this.userService.createUser(userData);
            
            return {
                status: 201,
                body: JSON.stringify(user)
            };
        } catch (error) {
            context.error('Error creating user:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to create user' })
            };
        }
    }

    async updateUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = request.params.userId;
            const body = await request.json();
            const userData = body as any;
            
            const user = await this.userService.updateUser(userId, userData);
            
            return {
                status: 200,
                body: JSON.stringify(user)
            };
        } catch (error) {
            context.error('Error updating user:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to update user' })
            };
        }
    }

    async getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = request.params.userId;
            const user = await this.userService.getUserById(userId);
            
            return {
                status: 200,
                body: JSON.stringify(user)
            };
        } catch (error) {
            context.error('Error getting user:', error);
            return {
                status: 404,
                body: JSON.stringify({ error: 'User not found' })
            };
        }
    }

    async getAllUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const users = await this.userService.getAll();
            
            return {
                status: 200,
                body: JSON.stringify(users)
            };
        } catch (error) {
            context.error('Error getting users:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to get users' })
            };
        }
    }

    async deleteUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
        try {
            const userId = request.params.userId;
            await this.userService.deleteUser(userId);
            
            return {
                status: 204
            };
        } catch (error) {
            context.error('Error deleting user:', error);
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to delete user' })
            };
        }
    }
}

const controller = new UsersController();

app.http('users', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getAllUsers(request, context);
        } else if (request.method === 'POST') {
            return controller.createUser(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
});

app.http('users/{userId}', {
    methods: ['GET', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === 'GET') {
            return controller.getUser(request, context);
        } else if (request.method === 'PUT') {
            return controller.updateUser(request, context);
        } else if (request.method === 'DELETE') {
            return controller.deleteUser(request, context);
        }
        
        return { status: 405, body: 'Method not allowed' };
    }
}); 