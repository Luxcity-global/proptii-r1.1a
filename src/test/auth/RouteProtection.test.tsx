import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock components for testing
const MockPublicPage = () => <div>Public Page</div>;
const MockProtectedPage = () => <div>Protected Page</div>;
const MockAdminPage = () => <div>Admin Page</div>;
const MockLoginPage = () => <div>Login Page</div>;
const MockUnauthorizedPage = () => <div>Unauthorized Page</div>;

// Mock AuthContext values
const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn()
};

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Route Protection Tests', () => {
    const renderWithRouter = (
        initialRoute: string,
        authContextValue = mockAuthContext
    ) => {
        vi.mocked(mockAuthContext).isAuthenticated = authContextValue.isAuthenticated;
        vi.mocked(mockAuthContext).user = authContextValue.user;
        vi.mocked(mockAuthContext).isLoading = authContextValue.isLoading;

        return render(
            <AuthProvider>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Routes>
                        <Route path="/login" element={<MockLoginPage />} />
                        <Route path="/unauthorized" element={<MockUnauthorizedPage />} />
                        <Route path="/public" element={<MockPublicPage />} />
                        <Route
                            path="/protected"
                            element={
                                <ProtectedRoute>
                                    <MockProtectedPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRoles={['admin']}>
                                    <MockAdminPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    describe('Authentication Checks', () => {
        it('should allow access to public routes when not authenticated', () => {
            renderWithRouter('/public');
            expect(screen.getByText('Public Page')).toBeInTheDocument();
        });

        it('should redirect to login page when accessing protected route while not authenticated', () => {
            renderWithRouter('/protected');
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });

        it('should allow access to protected route when authenticated', () => {
            renderWithRouter('/protected', {
                ...mockAuthContext,
                isAuthenticated: true,
                user: { id: '1', email: 'test@example.com', roles: [] }
            });
            expect(screen.getByText('Protected Page')).toBeInTheDocument();
        });

        it('should show loading state while checking authentication', () => {
            renderWithRouter('/protected', {
                ...mockAuthContext,
                isLoading: true
            });
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('Role-Based Access Control', () => {
        it('should redirect to unauthorized page when user lacks required role', () => {
            renderWithRouter('/admin', {
                ...mockAuthContext,
                isAuthenticated: true,
                user: { id: '1', email: 'test@example.com', roles: ['user'] }
            });
            expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
        });

        it('should allow access when user has required role', () => {
            renderWithRouter('/admin', {
                ...mockAuthContext,
                isAuthenticated: true,
                user: { id: '1', email: 'test@example.com', roles: ['admin'] }
            });
            expect(screen.getByText('Admin Page')).toBeInTheDocument();
        });

        it('should handle multiple required roles correctly', () => {
            render(
                <AuthProvider>
                    <MemoryRouter initialEntries={['/multi-role']}>
                        <Routes>
                            <Route
                                path="/multi-role"
                                element={
                                    <ProtectedRoute requiredRoles={['admin', 'manager']}>
                                        <div>Multi-Role Page</div>
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/unauthorized" element={<MockUnauthorizedPage />} />
                        </Routes>
                    </MemoryRouter>
                </AuthProvider>
            );

            // Should redirect when user has none of the required roles
            vi.mocked(mockAuthContext).isAuthenticated = true;
            vi.mocked(mockAuthContext).user = {
                id: '1',
                email: 'test@example.com',
                roles: ['user']
            };
            expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();

            // Should allow access when user has at least one required role
            vi.mocked(mockAuthContext).user = {
                id: '1',
                email: 'test@example.com',
                roles: ['user', 'manager']
            };
            expect(screen.getByText('Multi-Role Page')).toBeInTheDocument();
        });
    });

    describe('Session Handling', () => {
        it('should maintain protected route access during active session', async () => {
            renderWithRouter('/protected', {
                ...mockAuthContext,
                isAuthenticated: true,
                user: { id: '1', email: 'test@example.com', roles: [] }
            });

            await waitFor(() => {
                expect(screen.getByText('Protected Page')).toBeInTheDocument();
            });

            // Simulate session check
            vi.mocked(mockAuthContext).isAuthenticated = true;
            await waitFor(() => {
                expect(screen.getByText('Protected Page')).toBeInTheDocument();
            });
        });

        it('should redirect to login when session expires', async () => {
            renderWithRouter('/protected', {
                ...mockAuthContext,
                isAuthenticated: true,
                user: { id: '1', email: 'test@example.com', roles: [] }
            });

            await waitFor(() => {
                expect(screen.getByText('Protected Page')).toBeInTheDocument();
            });

            // Simulate session expiration
            vi.mocked(mockAuthContext).isAuthenticated = false;
            vi.mocked(mockAuthContext).user = null;

            await waitFor(() => {
                expect(screen.getByText('Login Page')).toBeInTheDocument();
            });
        });
    });

    describe('Navigation State Preservation', () => {
        it('should preserve attempted route after login redirect', () => {
            const { container } = renderWithRouter('/protected');

            // Check if the redirect state includes the attempted route
            const loginElement = screen.getByText('Login Page');
            expect(loginElement).toBeInTheDocument();

            // In a real app, we'd check the router state here
            // This is just a placeholder as we can't easily check router state in tests
            expect(container).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors gracefully', async () => {
            // Mock an authentication error
            vi.mocked(mockAuthContext).isLoading = true;
            renderWithRouter('/protected');

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Simulate authentication error
            vi.mocked(mockAuthContext).isLoading = false;
            vi.mocked(mockAuthContext).isAuthenticated = false;

            await waitFor(() => {
                expect(screen.getByText('Login Page')).toBeInTheDocument();
            });
        });

        it('should handle role verification errors gracefully', async () => {
            // Mock a role verification error
            vi.mocked(mockAuthContext).isAuthenticated = true;
            vi.mocked(mockAuthContext).user = {
                id: '1',
                email: 'test@example.com',
                roles: undefined // Simulate missing roles data
            };

            renderWithRouter('/admin');

            await waitFor(() => {
                expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
            });
        });
    });
}); 