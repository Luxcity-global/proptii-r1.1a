import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  styled,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton,
  Link,
  Divider,
  Paper,
  Collapse,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel
} from '@mui/material';
import { useBookViewing } from '../context/BookViewingContext';
import { usePropertySearch } from '../hooks/usePropertySearch';
import { useAddressLookup } from '../hooks/useAddressLookup';
import { Property } from '../context/BookViewingContext';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';

// Constants
const BLUE_COLOR = '#136C9E';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: BLUE_COLOR
  }
}));

const SupportedSites = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}));

interface ManualPropertyInput {
  postcode: string;
  houseNumber: string;
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  selectedAddress?: string;
}

export const PropertySelector: React.FC = () => {
  const { state, dispatch } = useBookViewing();
  const { searchProperty } = usePropertySearch();
  const { lookupAddress, isLoading: isAddressLoading, error: addressError, addresses } = useAddressLookup();
  const [url, setUrl] = useState('');
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  const [manualInput, setManualInput] = useState<ManualPropertyInput>({
    postcode: '',
    houseNumber: '',
    agencyName: '',
    agencyEmail: '',
    agencyPhone: '',
    selectedAddress: ''
  });
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    try {
      await searchProperty(url);
    } catch (error) {
      console.error('Error searching property:', error);
    }
  };

  const handleManualInputChange = (field: keyof ManualPropertyInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setManualInput(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePostcodeSearch = async () => {
    if (!manualInput.postcode.trim()) {
      setAddressSearchError('Please enter a postcode');
      return;
    }

    try {
      setAddressSearchError(null);
      await lookupAddress(manualInput.postcode);
    } catch (error) {
      setAddressSearchError((error as Error).message);
    }
  };

  const handleAddressSelect = (event: SelectChangeEvent<string>) => {
    const selectedAddress = event.target.value;
    setManualInput(prev => ({
      ...prev,
      selectedAddress
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSearchError(null);

    // Basic validation
    if (!manualInput.postcode.trim() || !manualInput.selectedAddress) {
      setAddressSearchError('Please select a valid address');
      return;
    }

    try {
      // Create a manual property entry
      const manualProperty: Property = {
        id: `manual-${Date.now()}`,
        title: manualInput.selectedAddress,
        location: manualInput.selectedAddress,
        price: 'Price on Application',
        image: '/images/property-placeholder.jpg',
        specs: {
          beds: 0,
          baths: 0,
          area: 'N/A'
        },
        agentDetails: {
          name: manualInput.agencyName,
          email: manualInput.agencyEmail,
          phone: manualInput.agencyPhone
        }
      };

      dispatch({ type: 'SET_PROPERTY', payload: manualProperty });
    } catch (error) {
      setAddressSearchError('Error creating property. Please try again.');
      console.error('Error creating manual property:', error);
    }
  };

  const handlePropertySelect = (property: Property) => {
    dispatch({ type: 'SET_PROPERTY', payload: property });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Property
      </Typography>
      
      {/* URL Input Section */}
      <Box component="form" onSubmit={handleUrlSubmit} sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Paste a property URL from any supported site
          <Tooltip title="You can paste a search results URL or a single property URL from any of our supported property sites" arrow>
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <SupportedSites>
          <Typography variant="body2" color="textSecondary">
            Supported sites:
          </Typography>
          <Link href="https://www.rightmove.co.uk" target="_blank" rel="noopener">
            Rightmove
          </Link>
          <Typography variant="body2" color="textSecondary">•</Typography>
          <Link href="https://www.zoopla.co.uk" target="_blank" rel="noopener">
            Zoopla
          </Link>
          <Typography variant="body2" color="textSecondary">•</Typography>
          <Link href="https://www.openrent.co.uk" target="_blank" rel="noopener">
            OpenRent
          </Link>
        </SupportedSites>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              placeholder="Paste property URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              error={!!state.error}
              helperText={state.error}
              disabled={state.isLoading}
              InputProps={{
                endAdornment: state.isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={state.isLoading || !url}
              sx={{
                bgcolor: BLUE_COLOR,
                '&:hover': {
                  bgcolor: BLUE_COLOR,
                  opacity: 0.9
                }
              }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Divider with "Or" text */}
      <Box sx={{ position: 'relative', my: 4 }}>
        <Divider />
        <Typography
          variant="body1"
          component="span"
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            px: 2,
            color: 'text.secondary'
          }}
        >
          Or
        </Typography>
      </Box>

      {/* Manual Input Section */}
      <Box>
        <Button
          onClick={() => setIsManualExpanded(!isManualExpanded)}
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            color: BLUE_COLOR,
            mb: 2,
            bgcolor: isManualExpanded ? 'rgba(19, 108, 158, 0.12)' : 'rgba(19, 108, 158, 0.08)',
            '&:hover': {
              bgcolor: 'rgba(19, 108, 158, 0.15)'
            },
            borderRadius: 2,
            py: 1.5
          }}
          endIcon={isManualExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Fill in the property details manually
          </Typography>
        </Button>

        <Collapse in={isManualExpanded}>
          <Box component="form" onSubmit={handleManualSubmit}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Grid container spacing={3}>
                {/* Property Address */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Property Address
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Postcode"
                        value={manualInput.postcode}
                        onChange={handleManualInputChange('postcode')}
                        error={!!addressSearchError}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handlePostcodeSearch}
                                disabled={isAddressLoading || !manualInput.postcode.trim()}
                              >
                                {isAddressLoading ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <SearchIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Select Address</InputLabel>
                        <Select
                          value={manualInput.selectedAddress || ''}
                          onChange={handleAddressSelect}
                          disabled={addresses.length === 0}
                          error={!!addressSearchError}
                        >
                          {addresses.map((address, index) => (
                            <MenuItem key={index} value={address.formatted_address.join(', ')}>
                              {address.formatted_address.join(', ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {addressSearchError && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      {addressSearchError}
                    </Typography>
                  )}
                </Grid>

                {/* Estate Agent Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estate Agent Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Estate Agency Name"
                        value={manualInput.agencyName}
                        onChange={handleManualInputChange('agencyName')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Agency Email"
                        type="email"
                        value={manualInput.agencyEmail}
                        onChange={handleManualInputChange('agencyEmail')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Agency Phone"
                        value={manualInput.agencyPhone}
                        onChange={handleManualInputChange('agencyPhone')}
                        required
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={!manualInput.selectedAddress || !manualInput.agencyName || !manualInput.agencyEmail || !manualInput.agencyPhone}
                    sx={{
                      bgcolor: BLUE_COLOR,
                      '&:hover': {
                        bgcolor: BLUE_COLOR,
                        opacity: 0.9
                      }
                    }}
                  >
                    Add Property
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Collapse>
      </Box>

      {/* Error State */}
      {state.error && !state.isLoading && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      )}

      {/* Property Results */}
      {state.propertyResults.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Found Properties
          </Typography>
          <Grid container spacing={3}>
            {state.propertyResults.map((property) => (
              <Grid item xs={12} key={property.id}>
                <StyledCard>
                  <Box sx={{ display: 'flex', height: 200 }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 300 }}
                      image={property.image}
                      alt={property.title}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {property.title}
                        </Typography>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          {property.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {property.location}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            {property.specs.beds} beds • {property.specs.baths} baths • {property.specs.area}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ mt: 'auto', p: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => handlePropertySelect(property)}
                          sx={{
                            bgcolor: BLUE_COLOR,
                            '&:hover': {
                              bgcolor: BLUE_COLOR,
                              opacity: 0.9
                            }
                          }}
                        >
                          Select Property
                        </Button>
                      </CardActions>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PropertySelector; 