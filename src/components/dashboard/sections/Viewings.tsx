import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Grid,
  styled,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { formatDate } from '../../../utils/formatters';


const PropertyImage = styled('img')({
  width: 170,
  height: 150,
  borderRadius: 4,
  objectFit: 'cover'
});

/**
 * Viewings component to display upcoming and past property viewings
 */
const Viewings: React.FC = () => {
  const { isLoading, error, upcomingViewings, pastViewings } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'upcoming' | 'past') => {
    setActiveTab(newValue);
  };

  const activeViewings = activeTab === 'upcoming' ? upcomingViewings : pastViewings;

  return (
    <Box bgcolor={'#EDF3FA'} padding={3}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Property Viewings
        </Typography>
        <Button 
                    variant="contained" 
                    sx={{ 
                    backgroundColor: '#DC5F12', // Use custom color here
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                    backgroundColor: '#C44E0F', // Optional: Define hover color
                     }
                      }}
                    >
                     Request Viewing
                  </Button>
      </Box>
      <div className='ViewingsCardContainer' style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '1rem'}}>
      <div className="upcomingViewingscard bg-white p-4 rounded-lg shadow flex items-center" style={{ gap: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'start', height: 'auto', width: '230px', border: '1px solid #81B0F8'}}>
          <div style={{ gap: '0.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', }}>
            <h2 className="text-xl font-semibold">{upcomingViewings.length}</h2>
            <p className="text-gray-600">Upcoming Viewings</p>
            <p className="text-xs text-gray-500">As of {formatDate(new Date().toISOString())}</p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 21 21"
            fill="none"

            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_1919_20172)">
              <path d="M20.6509 8.40288C19.2795 6.16929 16.1599 2.42188 10.6846 2.42188C5.20943 2.42188 2.08982 6.16929 0.718367 8.40288C0.294398 9.08861 0.0698242 9.87889 0.0698242 10.6851C0.0698242 11.4913 0.294398 12.2816 0.718367 12.9673C2.08982 15.2009 5.20943 18.9483 10.6846 18.9483C16.1599 18.9483 19.2795 15.2009 20.6509 12.9673C21.0749 12.2816 21.2995 11.4913 21.2995 10.6851C21.2995 9.87889 21.0749 9.08861 20.6509 8.40288ZM19.1433 12.0415C17.9655 13.9568 15.2995 17.1799 10.6846 17.1799C6.06979 17.1799 3.40381 13.9568 2.226 12.0415C1.97411 11.6339 1.84069 11.1643 1.84069 10.6851C1.84069 10.206 1.97411 9.73627 2.226 9.32868C3.40381 7.41341 6.06979 4.19036 10.6846 4.19036C15.2995 4.19036 17.9655 7.40988 19.1433 9.32868C19.3952 9.73627 19.5286 10.206 19.5286 10.6851C19.5286 11.1643 19.3952 11.6339 19.1433 12.0415Z" fill="#DC5F12"/>
              <path d="M10.6844 6.26367C9.80996 6.26367 8.95516 6.52297 8.2281 7.00878C7.50104 7.49459 6.93436 8.18508 6.59973 8.99295C6.2651 9.80082 6.17754 10.6898 6.34814 11.5474C6.51873 12.405 6.93981 13.1928 7.55813 13.8111C8.17644 14.4295 8.96423 14.8505 9.82186 15.0211C10.6795 15.1917 11.5684 15.1042 12.3763 14.7695C13.1842 14.4349 13.8747 13.8682 14.3605 13.1412C14.8463 12.4141 15.1056 11.5593 15.1056 10.6849C15.1042 9.51273 14.6379 8.389 13.8091 7.56016C12.9803 6.73133 11.8565 6.26508 10.6844 6.26367ZM10.6844 13.3376C10.1597 13.3376 9.64685 13.182 9.21062 12.8905C8.77438 12.599 8.43437 12.1847 8.23359 11.7C8.03281 11.2153 7.98028 10.6819 8.08264 10.1674C8.18499 9.65278 8.43764 9.18011 8.80863 8.80912C9.17962 8.43813 9.65229 8.18548 10.1669 8.08312C10.6814 7.98077 11.2148 8.0333 11.6995 8.23408C12.1843 8.43486 12.5986 8.77486 12.89 9.2111C13.1815 9.64734 13.3371 10.1602 13.3371 10.6849C13.3371 11.3884 13.0576 12.0632 12.5601 12.5606C12.0627 13.0581 11.3879 13.3376 10.6844 13.3376Z" fill="#DC5F12"
              
              />
            </g>
          </svg>
        </div>

        <div className="CompletedViewingscard bg-white p-4 rounded-lg shadow flex items-center" style={{ gap: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'start', height: 'auto', width: '230px', border: '1px solid #81B0F8'}}>
          <div style={{ gap: '0.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', }}>
            <h2 className="text-xl font-semibold">{pastViewings.length}</h2>
            <p className="text-gray-600">Completed Viewings</p>
            <p className="text-xs text-gray-500">As of {formatDate(new Date().toISOString())}</p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 21 21"
            fill="none"
            
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_1919_20172)">
              <path d="M20.6509 8.40288C19.2795 6.16929 16.1599 2.42188 10.6846 2.42188C5.20943 2.42188 2.08982 6.16929 0.718367 8.40288C0.294398 9.08861 0.0698242 9.87889 0.0698242 10.6851C0.0698242 11.4913 0.294398 12.2816 0.718367 12.9673C2.08982 15.2009 5.20943 18.9483 10.6846 18.9483C16.1599 18.9483 19.2795 15.2009 20.6509 12.9673C21.0749 12.2816 21.2995 11.4913 21.2995 10.6851C21.2995 9.87889 21.0749 9.08861 20.6509 8.40288ZM19.1433 12.0415C17.9655 13.9568 15.2995 17.1799 10.6846 17.1799C6.06979 17.1799 3.40381 13.9568 2.226 12.0415C1.97411 11.6339 1.84069 11.1643 1.84069 10.6851C1.84069 10.206 1.97411 9.73627 2.226 9.32868C3.40381 7.41341 6.06979 4.19036 10.6846 4.19036C15.2995 4.19036 17.9655 7.40988 19.1433 9.32868C19.3952 9.73627 19.5286 10.206 19.5286 10.6851C19.5286 11.1643 19.3952 11.6339 19.1433 12.0415Z" fill="#DC5F12"/>
              <path d="M10.6844 6.26367C9.80996 6.26367 8.95516 6.52297 8.2281 7.00878C7.50104 7.49459 6.93436 8.18508 6.59973 8.99295C6.2651 9.80082 6.17754 10.6898 6.34814 11.5474C6.51873 12.405 6.93981 13.1928 7.55813 13.8111C8.17644 14.4295 8.96423 14.8505 9.82186 15.0211C10.6795 15.1917 11.5684 15.1042 12.3763 14.7695C13.1842 14.4349 13.8747 13.8682 14.3605 13.1412C14.8463 12.4141 15.1056 11.5593 15.1056 10.6849C15.1042 9.51273 14.6379 8.389 13.8091 7.56016C12.9803 6.73133 11.8565 6.26508 10.6844 6.26367ZM10.6844 13.3376C10.1597 13.3376 9.64685 13.182 9.21062 12.8905C8.77438 12.599 8.43437 12.1847 8.23359 11.7C8.03281 11.2153 7.98028 10.6819 8.08264 10.1674C8.18499 9.65278 8.43764 9.18011 8.80863 8.80912C9.17962 8.43813 9.65229 8.18548 10.1669 8.08312C10.6814 7.98077 11.2148 8.0333 11.6995 8.23408C12.1843 8.43486 12.5986 8.77486 12.89 9.2111C13.1815 9.64734 13.3371 10.1602 13.3371 10.6849C13.3371 11.3884 13.0576 12.0632 12.5601 12.5606C12.0627 13.0581 11.3879 13.3376 10.6844 13.3376Z" fill="#DC5F12"
              />
            </g>
          </svg>
        </div>
        </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="viewing tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5
            }
          }}
        >
          <Tab 
            label={`Upcoming (${upcomingViewings.length})`} 
            value="upcoming" 
            id="upcoming-tab"
            aria-controls="upcoming-tabpanel"
          />
          <Tab 
            label={`Past (${pastViewings.length})`} 
            value="past" 
            id="past-tab"
            aria-controls="past-tabpanel"
          />
        </Tabs>
      </Box>

      {activeViewings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CalendarMonthIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Viewings
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming property viewings scheduled."
              : "You haven't attended any property viewings yet."}
          </Typography>
          {activeTab === 'upcoming' && (
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
            >
              Request Viewing
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3} padding={0}>
          {activeViewings.map((viewing) => (
            <Grid item xs={12} md={6} key={viewing.id} padding={0}>
              <Card sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                paddingLeft: 1,
                paddingTop: 1,
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
                backgroundColor: 'white', 
                border: '1px rgb(233, 233, 233) solid' 
              }}>
                <Box sx={{ display: 'flex', height: 160 }}>
                  <PropertyImage
                    src="/images/UK house3.jpeg"
                    alt={viewing.propertyAddress}
                  />
                  
                  
                  <CardContent sx={{ flex: '1 0 auto', p: 2, gap:10 }}>

                    <Chip 
                      label={viewing.status === 'upcoming' ? 'Upcoming' : viewing.status === 'completed' ? 'Completed' : 'Cancelled'}
                      color={viewing.status === 'upcoming' ? 'primary' : viewing.status === 'completed' ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />

                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      {viewing.propertyAddress}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarMonthIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {viewing.date}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {viewing.time}
                      </Typography>
                    </Box>

                    
                  </CardContent>
                </Box>
                
                <Divider />
                
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estate Agent Details
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {viewing.agentName}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {viewing.agentContact}
                    </Typography>
                  </Box>
                </Box>
                
                {viewing.status === 'upcoming' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      color="error"
                      sx={{ 
                        borderRadius: 4,
                        textTransform: 'none',
                      }}
                    >
                      Cancel Viewing
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      sx={{ 
                        borderRadius: 4,
                        textTransform: 'none',
                      }}
                    >
                      Reschedule
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, pt: 0 }}>
                    {viewing.notes && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Notes:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {viewing.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Viewings; 