import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme';
import Home from './pages/Home';
import ContractsPage from './pages/Contracts';
import { ReferencingPage } from './pages/Referencing';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { NotFoundPage } from './pages/NotFound';
import Dashboard from './components/dashboard/Dashboard';
import DashboardHome from './components/dashboard/sections/DashboardHome';
import SavedProperties from './components/dashboard/sections/SavedProperties';
import Viewings from './components/dashboard/sections/Viewings';
import DashboardReferencing from './components/dashboard/sections/DashboardReferencing';
import BookViewing from './pages/BookViewing';
import AgentHome from './pages/AgentHome';
import Listings from './pages/Listings';
import NewListingPage from './pages/listings/new';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/agent" element={<AgentHome />} />
              <Route path="/contracts" element={<ContractsPage />} />
              
              {/* Referencing routes */}
              <Route path="/referencing" element={<ReferencingPage />} />
              <Route path="/referencing/:propertyId" element={<ReferencingPage />} />
              
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/book-viewing" element={<BookViewing />} />
              
              {/* Listings routes */}
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/new" element={<NewListingPage />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="saved-searches" element={<SavedProperties />} />
                <Route path="viewings" element={<Viewings />} />
                <Route path="referencing" element={<DashboardReferencing />} />
                <Route path="contracts" element={<ContractsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;