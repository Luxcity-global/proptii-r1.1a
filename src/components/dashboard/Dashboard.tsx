import React, { useState } from 'react';
import { Box, Grid, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './ui/DashboardSidebar';
import DashboardHeader from './ui/DashboardHeader';

// Define color constants (matching ReferencingModal)
export const BLUE_COLOR = '#136C9E';
export const ORANGE_COLOR = '#DC5F12';
export const LIGHT_GREY = '#AAAAAA';
export const DARK_GREY = '#555555';

// Define the sections for the dashboard
export const DASHBOARD_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'saved-searches', label: 'Saved Searches', path: '/dashboard/saved-searches' },
  { id: 'viewings', label: 'Viewings', path: '/dashboard/viewings' },
  { id: 'referencing', label: 'Referencing', path: '/dashboard/referencing' },
  { id: 'contracts', label: 'Contracts', path: '/dashboard/contracts' },
  { id: 'files', label: 'Your Files', path: '/dashboard/files' },
];

/**
 * Dashboard component for tenant portal
 * This is the main container component that manages the dashboard layout
 */
const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      bgcolor: theme.palette.background.default
    }}>
      <CssBaseline />

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {!isMobile && (
          <DashboardSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
          />
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <DashboardHeader userName="Tosin Lanipekun" />
          
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 