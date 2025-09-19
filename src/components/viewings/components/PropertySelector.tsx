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
import { Tooltip } from '../../Tooltip';

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

  const handlePropertyChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: {
        ...state.selectedProperty,
        [field]: value
      }
    });
  };

  const handleAgentChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: {
        ...state.selectedProperty,
        agent: {
          ...state.selectedProperty?.agent,
          [field]: value
        }
      }
    });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, color: '#DC5F12' }}>Property Details</Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#666666' }}>
        Please enter the property details and estate agent information.
      </Typography>

      {/* Property Address Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#666666' }}>
          Property Address
        </Typography>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Tooltip
            content="Copy the property and agent details from the listing and enter them into the form. We'll take it from there and help you contact the agent."
            position="top"
            trigger="hover"
            forcePosition={true}
          >
            <div>
              <TextField
                fullWidth
                label="First line of address"
                value={state.selectedProperty?.street || ''}
                onChange={(e) => handlePropertyChange('street', e.target.value)}
              />
            </div>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="City"
            value={state.selectedProperty?.city || ''}
            onChange={(e) => handlePropertyChange('city', e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Town"
            value={state.selectedProperty?.town || ''}
            onChange={(e) => handlePropertyChange('town', e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Postcode (Optional)"
            value={state.selectedProperty?.postcode || ''}
            onChange={(e) => handlePropertyChange('postcode', e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>

      {/* Estate Agent Details Section */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#666666' }}>
          Estate Agent Details
        </Typography>
        <TextField
          fullWidth
          label="Agent Name"
          value={state.selectedProperty?.agent?.name || ''}
          onChange={(e) => handleAgentChange('name', e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Company"
          value={state.selectedProperty?.agent?.company || ''}
          onChange={(e) => handleAgentChange('company', e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Tooltip
            content="If the email isn't listed on the property page, try searching for the agency's contact details online and add the agent's email address here."
            position="top"
            trigger="hover"
            forcePosition={true}
          >
            <div>
              <TextField
                fullWidth
                label="Agent Email"
                value={state.selectedProperty?.agent?.email || ''}
                onChange={(e) => handleAgentChange('email', e.target.value)}
                type="email"
              />
            </div>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          label="Agent Phone"
          value={state.selectedProperty?.agent?.phone || ''}
          onChange={(e) => handleAgentChange('phone', e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>
    </Box>
  );
};

export default PropertySelector; 