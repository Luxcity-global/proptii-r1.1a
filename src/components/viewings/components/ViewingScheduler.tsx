import React from 'react';
import {
  Box,
  TextField,
  Typography,
  styled,
  Paper,
  Grid,
  alpha,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
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

const ViewingScheduler: React.FC = () => {
  const { state, dispatch } = useBookViewing();

  const handleDateChange = (date: Date | null) => {
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        date: date,
      },
    });
  };

  const handleTimeChange = (time: Date | null) => {
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        time: time,
      },
    });
  };

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        preference: event.target.value,
      },
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionTitle variant="h6">Schedule Viewing</SectionTitle>
      <SectionDescription variant="body2">
        Choose your preferred date and time for the viewing.
      </SectionDescription>

      <StyledPaper>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, fontWeight: 500 }}>
              Viewing Details
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ mb: 3 }}>
                <DatePicker
                  label="Select Date"
                  value={state.viewingDetails?.date || null}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <StyledTextField {...params} fullWidth />
                  )}
                  minDate={new Date()}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <TimePicker
                  label="Select Time"
                  value={state.viewingDetails?.time || null}
                  onChange={handleTimeChange}
                  renderInput={(params) => (
                    <StyledTextField {...params} fullWidth />
                  )}
                  views={['hours', 'minutes']}
                  ampm={false}
                />
              </Box>
            </LocalizationProvider>

            <StyledTextField
              select
              fullWidth
              label="Viewing Preference"
              value={state.viewingDetails?.preference || ''}
              onChange={handlePreferenceChange}
            >
              <MenuItem value="in-person">In-Person Viewing</MenuItem>
              <MenuItem value="virtual">Virtual Viewing</MenuItem>
            </StyledTextField>
          </Grid>
        </Grid>
      </StyledPaper>
    </Box>
  );
};

export default ViewingScheduler;