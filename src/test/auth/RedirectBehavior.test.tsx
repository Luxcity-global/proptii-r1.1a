import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock components
const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{JSON.stringify(location)}</div>;
};

const MockLoginPage = () => {
    const location = useLocation();
    return (
        <div>
            <div>Login Page</div>
            <div data-testid="location-state">{JSON.stringify(location.state)}</div>
        </div>
    );
};

const MockProtectedPage = () => <div>Protected Page</div>;

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

describe('Redirect Behavior Tests', () => {
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
                        <Route path="/" element={<div>Home Page</div>} />
                        <Route
                            path="/protected"
                            element={
                                <ProtectedRoute>
                                    <MockProtectedPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<LocationDisplay />} />
                    </Routes>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    describe('Login Redirect State', () => {
        it('should include the attempted route in redirect state', async () => {
            renderWithRouter('/protected');

            const locationState = screen.getByTestId('location-state');
            const state = JSON.parse(locationState.textContent || '{}');

            expect(state.from.pathname).toBe('/protected');
        });

        it('should preserve query parameters in redirect state', async () => {
            renderWithRouter('/protected?key=value');

            const locationState = screen.getByTestId('location-state');
            const state = JSON.parse(locationState.textContent || '{}');

            expect(state.from.search).toBe('?key=value');
        });

        it('should handle nested routes in redirect state', async () => {
            renderWithRouter('/protected/nested/route');

            const locationState = screen.getByTestId('location-state');
            const state = JSON.parse(locationState.textContent || '{}');

            expect(state.from.pathname).toBe('/protected/nested/route');
        });
    });

    describe('Post-Authentication Redirect', () => {
        it('should redirect back to attempted route after authentication', async () => {
            // Start unauthenticated
            renderWithRouter('/protected');
            expect(screen.getByText('Login Page')).toBeInTheDocument();

            // Simulate successful authentication
            vi.mocked(mockAuthContext).isAuthenticated = true;
            vi.mocked(mockAuthContext).user = {
                id: '1',
                email: 'test@example.com',
                roles: []
            };

            await waitFor(() => {
                expect(screen.getByText('Protected Page')).toBeInTheDocument();
            });
        });

        it('should handle redirect loops gracefully', async () => {
            // Simulate a potential redirect loop scenario
            let redirectCount = 0;
            const maxRedirects = 5;

            const checkRedirects = () => {
                redirectCount++;
                if (redirectCount > maxRedirects) {
                    throw new Error('Maximum redirect limit exceeded');
                }
            };

            renderWithRouter('/protected');
            checkRedirects();
            expect(screen.getByText('Login Page')).toBeInTheDocument();

            // Multiple auth state changes
            for (let i = 0; i < 3; i++) {
                vi.mocked(mockAuthContext).isAuthenticated = true;
                await waitFor(() => {
                    checkRedirects();
                    expect(screen.getByText('Protected Page')).toBeInTheDocument();
                });

                vi.mocked(mockAuthContext).isAuthenticated = false;
                await waitFor(() => {
                    checkRedirects();
                    expect(screen.getByText('Login Page')).toBeInTheDocument();
                });
            }

            expect(redirectCount).toBeLessThanOrEqual(maxRedirects);
        });
    });

    describe('Edge Cases', () => {
        it('should handle malformed redirect states', async () => {
            // Simulate a malformed state in the location
            render(
                <AuthProvider>
                    <MemoryRouter
                        initialEntries={[
                            {
                                pathname: '/login',
                                state: { from: null } // Malformed state
                            }
                        ]}
                    >
                        <Routes>
                            <Route path="/login" element={<MockLoginPage />} />
                            <Route path="/" element={<div>Home Page</div>} />
                        </Routes>
                    </MemoryRouter>
                </AuthProvider>
            );

            // Should not crash and show login page
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });

        it('should handle concurrent authentication state changes', async () => {
            renderWithRouter('/protected');
            expect(screen.getByText('Login Page')).toBeInTheDocument();

            // Simulate rapid authentication state changes
            const stateChanges = [true, false, true, false, true];

            for (const state of stateChanges) {
                vi.mocked(mockAuthContext).isAuthenticated = state;
                vi.mocked(mockAuthContext).user = state
                    ? { id: '1', email: 'test@example.com', roles: [] }
                    : null;

                await waitFor(() => {
                    expect(
                        screen.getByText(state ? 'Protected Page' : 'Login Page')
                    ).toBeInTheDocument();
                });
            }
        });

        it('should handle navigation during authentication check', async () => {
            // Start with loading state
            vi.mocked(mockAuthContext).isLoading = true;
            renderWithRouter('/protected');
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Simulate navigation during loading
            vi.mocked(mockAuthContext).isLoading = false;
            vi.mocked(mockAuthContext).isAuthenticated = false;

            await waitFor(() => {
                expect(screen.getByText('Login Page')).toBeInTheDocument();
            });
        });
    });
}); 