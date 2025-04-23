import React from 'react';
import {
  Box,
  TextField,
  Typography,
  styled,
  Paper,
  Grid,
  alpha,
  Divider
} from '@mui/material';
import { useBookViewing } from '../context/BookViewingContext';

// Constants
const BLUE_COLOR = '#136C9E';
const ORANGE_COLOR = '#DC5F12';
const DARK_GREY = '#333333';
const LIGHT_GREY = '#AAAAAA';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: 'none',
  border: `1px solid ${alpha(BLUE_COLOR, 0.12)}`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: ORANGE_COLOR,
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const SectionDescription = styled(Typography)(({ theme }) => ({
  color: LIGHT_GREY,
  marginBottom: theme.spacing(3),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: alpha(BLUE_COLOR, 0.23),
    },
    '&:hover fieldset': {
      borderColor: alpha(BLUE_COLOR, 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: BLUE_COLOR,
    },
  },
  '& .MuiInputLabel-root': {
    color: DARK_GREY,
    '&.Mui-focused': {
      color: BLUE_COLOR,
    },
  },
}));

const PropertySelector: React.FC = () => {
  const { state, dispatch } = useBookViewing();

  const handlePropertyChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: {
        ...state.selectedProperty,
        [field]: event.target.value,
      },
    });
  };

  const handleAgentChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: {
        ...state.selectedProperty,
        agent: {
          ...state.selectedProperty?.agent,
          [field]: event.target.value,
        },
      },
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionTitle variant="h6">Property Details</SectionTitle>
      <SectionDescription variant="body2">
        Please enter the property details and estate agent information.
      </SectionDescription>

      <StyledPaper>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, fontWeight: 500 }}>
              Property Address
            </Typography>
            <StyledTextField
              fullWidth
              label="First line of address"
              value={state.selectedProperty?.street || ''}
              onChange={handlePropertyChange('street')}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="City"
                  value={state.selectedProperty?.city || ''}
                  onChange={handlePropertyChange('city')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="Town"
                  value={state.selectedProperty?.town || ''}
                  onChange={handlePropertyChange('town')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="Postcode"
                  value={state.selectedProperty?.postcode || ''}
                  onChange={handlePropertyChange('postcode')}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, fontWeight: 500 }}>
              Estate Agent Details
            </Typography>
            <StyledTextField
              fullWidth
              label="Agent Name"
              value={state.selectedProperty?.agent?.name || ''}
              onChange={handleAgentChange('name')}
            />
            <StyledTextField
              fullWidth
              label="Company"
              value={state.selectedProperty?.agent?.company || ''}
              onChange={handleAgentChange('company')}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Agent Email"
                  type="email"
                  value={state.selectedProperty?.agent?.email || ''}
                  onChange={handleAgentChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Agent Phone"
                  value={state.selectedProperty?.agent?.phone || ''}
                  onChange={handleAgentChange('phone')}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </StyledPaper>
    </Box>
  );
};

export default PropertySelector; 