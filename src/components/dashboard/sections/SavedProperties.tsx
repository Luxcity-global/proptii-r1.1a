import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  styled,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BathtubIcon from '@mui/icons-material/Bathtub';
import KingBedIcon from '@mui/icons-material/KingBed';
import HomeIcon from '@mui/icons-material/Home';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { AlignJustify } from 'lucide-react';

const PropertyImage = styled('img')({
  width: '100%',
  height: 180,
  borderRadius: 4,
  objectFit: 'cover'
});


/**
 * SavedProperties component to display properties saved by the user
 */
const SavedProperties: React.FC = () => {  
  const { isLoading, error, savedProperties } = useDashboardData();

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

  return ( 
    <Box bgcolor={'#EDF3FA'} display={'flex'} flexDirection={'column'} justifyContent={'stretch' }      padding={3}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}  >
        <Typography variant="h5" component="h1">
          Saved Properties
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
  Browse Properties
</Button>
      </Box>

          

      {savedProperties.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HomeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Saved Properties
          </Typography>
          <Typography variant="body1" color= '#1E9674' paragraph>
            You haven't saved any properties yet. Browse listings and click the heart icon to save properties you're interested in.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
          >
            Browse Properties
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {savedProperties.map((property) => (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
              <Card sx={{ 
                height: '100%',
                width: '80%',
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'white',
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 1,
                gap: 2,
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <Box sx={{ position: 'relative' }}>
                <PropertyImage
                    src="/images/detached-house.jpg"
                    alt={property.address}
                  />
                  
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    p: 0.5
                  }}>
                    <IconButton size="small" color="error" aria-label="remove from saved">
                      <FavoriteIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    width: '100%',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    p: 1,
                    px: 2
                  }}>
                    <Typography variant="h6" component="div">
                      {formatCurrency(property.price)}
                    </Typography>
                  </Box>
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {property.address}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {property.city}, {property.postcode}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mt: 2, justifyContent: 'start', gap: 1 }}>
                    <Chip 
                      icon={<KingBedIcon style={{color: '#D68552'}} /> } 
                      label={`${property.bedrooms} ${property.bedrooms === 1 ? 'Bed' : 'Beds'}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      icon={<BathtubIcon style={{color: '#357E99'}} />} 
                      label={`${property.bathrooms} ${property.bathrooms === 1 ? 'Bath' : 'Baths'}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      icon={<HomeIcon style={{color: '#1E9674'}} />} 
                      label={property.propertyType}
                      size="small"
                    />
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Saved on {formatDate(property.savedAt)}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="contained"
                    sx={{ 
                      borderRadius: 4,
                      textTransform: 'none',
                      px: 2
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SavedProperties; 