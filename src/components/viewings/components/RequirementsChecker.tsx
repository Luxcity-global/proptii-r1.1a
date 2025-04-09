import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  styled
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HomeIcon from '@mui/icons-material/Home';

// Constants
const BLUE_COLOR = '#136C9E';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`
}));

const PropertyCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: BLUE_COLOR
  }
}));

// Mock data
const requirements = [
  { id: 1, text: 'Minimum 2 bedrooms', matched: true },
  { id: 2, text: 'Maximum budget £2,500', matched: true },
  { id: 3, text: 'Within 30 minutes of work', matched: false },
  { id: 4, text: 'Pet friendly', matched: true },
  { id: 5, text: 'Furnished', matched: true }
];

const similarProperties = [
  {
    id: 1,
    title: 'Modern 2 Bed Apartment',
    location: 'London, SW1',
    price: '£2,400/month',
    matchScore: 85,
    image: '/images/property1.jpg'
  },
  {
    id: 2,
    title: 'Luxury Studio Flat',
    location: 'London, W1',
    price: '£2,200/month',
    matchScore: 75,
    image: '/images/property2.jpg'
  }
];

export const RequirementsChecker: React.FC = () => {
  const calculateMatchPercentage = () => {
    const matched = requirements.filter(req => req.matched).length;
    return Math.round((matched / requirements.length) * 100);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Requirements Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Requirements List */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Typography variant="subtitle1" gutterBottom>
              Your Requirements
            </Typography>
            <List>
              {requirements.map((req) => (
                <ListItem key={req.id}>
                  <ListItemIcon>
                    {req.matched ? (
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <WarningIcon sx={{ color: 'warning.main' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={req.text} />
                  <Chip
                    label={req.matched ? 'Matched' : 'Not Matched'}
                    color={req.matched ? 'success' : 'warning'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {calculateMatchPercentage()}% Match
              </Typography>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Similar Properties */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Typography variant="subtitle1" gutterBottom>
              Similar Properties
            </Typography>
            <Grid container spacing={2}>
              {similarProperties.map((property) => (
                <Grid item xs={12} key={property.id}>
                  <PropertyCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <HomeIcon sx={{ mr: 1, color: BLUE_COLOR }} />
                      <Typography variant="subtitle1">
                        {property.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {property.location}
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {property.price}
                    </Typography>
                    <Chip
                      label={`${property.matchScore}% Match`}
                      color="success"
                      size="small"
                    />
                  </PropertyCard>
                </Grid>
              ))}
            </Grid>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RequirementsChecker; 