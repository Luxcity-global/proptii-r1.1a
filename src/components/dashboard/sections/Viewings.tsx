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

/**
 * Viewings component to display upcoming and past property viewings
 */
const Viewings: React.FC = () => {
  const { isLoading, error, upcomingViewings, pastViewings } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
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
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Property Viewings
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ 
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Request Viewing
        </Button>
      </Box>

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
        <Grid container spacing={3}>
          {activeViewings.map((viewing) => (
            <Grid item xs={12} md={6} key={viewing.id}>
              <Card sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <Box sx={{ display: 'flex', height: 160 }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 240 }}
                    image={viewing.propertyImageUrl || "/images/property-placeholder.jpg"}
                    alt={viewing.propertyAddress}
                  />
                  <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
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

                    <Chip 
                      label={viewing.status === 'upcoming' ? 'Upcoming' : viewing.status === 'completed' ? 'Completed' : 'Cancelled'}
                      color={viewing.status === 'upcoming' ? 'primary' : viewing.status === 'completed' ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
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