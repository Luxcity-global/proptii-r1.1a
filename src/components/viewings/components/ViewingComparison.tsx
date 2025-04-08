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
  Button,
  styled
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

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
const viewedProperties = [
  {
    id: 1,
    title: 'Modern 2 Bed Apartment',
    location: 'London, SW1',
    price: '£2,400/month',
    rating: 4.5,
    pros: [
      'Spacious living area',
      'Modern appliances',
      'Great location',
      'Pet friendly'
    ],
    cons: [
      'No parking',
      'Small kitchen',
      'Noisy street'
    ],
    isFavorite: true
  },
  {
    id: 2,
    title: 'Luxury Studio Flat',
    location: 'London, W1',
    price: '£2,200/month',
    rating: 4.0,
    pros: [
      'High ceilings',
      'Central location',
      'Gym access',
      '24/7 concierge'
    ],
    cons: [
      'Limited storage',
      'No outdoor space',
      'Expensive area'
    ],
    isFavorite: false
  }
];

const nextSteps = [
  {
    title: 'Schedule Second Viewing',
    description: 'Book another viewing to explore the property in more detail'
  },
  {
    title: 'Start Referencing',
    description: 'Begin the referencing process for your chosen property'
  },
  {
    title: 'View More Properties',
    description: 'Explore other properties in your preferred area'
  }
];

export const ViewingComparison: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Compare Viewed Properties
      </Typography>

      <Grid container spacing={3}>
        {/* Properties Comparison */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {viewedProperties.map((property) => (
              <Grid item xs={12} md={6} key={property.id}>
                <StyledPaper>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {property.title}
                    </Typography>
                    <Button
                      startIcon={property.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      color={property.isFavorite ? 'error' : 'inherit'}
                    >
                      {property.isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                  </Box>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {property.price}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {property.location}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Rating: {property.rating}/5
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pros
                    </Typography>
                    <List dense>
                      {property.pros.map((pro, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon sx={{ color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={pro} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Cons
                    </Typography>
                    <List dense>
                      {property.cons.map((con, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CancelIcon sx={{ color: 'error.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={con} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </StyledPaper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Next Steps */}
        <Grid item xs={12}>
          <StyledPaper>
            <Typography variant="subtitle1" gutterBottom>
              Next Steps
            </Typography>
            <Grid container spacing={2}>
              {nextSteps.map((step, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <PropertyCard>
                    <Typography variant="subtitle1" gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {step.description}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        bgcolor: BLUE_COLOR,
                        '&:hover': {
                          bgcolor: BLUE_COLOR,
                          opacity: 0.9
                        }
                      }}
                    >
                      Get Started
                    </Button>
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

export default ViewingComparison; 