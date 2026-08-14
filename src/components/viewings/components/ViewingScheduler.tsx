import React from 'react';
import {
  Box,
  TextField,
  Typography,
  styled,
  Paper,
  Grid,
  alpha,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
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

const NotificationCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'disabled',
})<{ selected?: boolean; disabled?: boolean }>(({ theme, selected, disabled }) => ({
  flex: 1,
  padding: theme.spacing(2),
  borderRadius: 12,
  border: `2px solid ${selected ? ORANGE_COLOR : alpha(BLUE_COLOR, 0.08)}`,
  backgroundColor: selected ? alpha(ORANGE_COLOR, 0.04) : '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  minWidth: '110px',
  filter: disabled ? 'blur(2.5px)' : 'none',
  opacity: disabled ? 0.72 : 1,
  pointerEvents: disabled ? 'none' : 'auto',
  userSelect: disabled ? 'none' : 'auto',
  '&:hover': disabled ? undefined : {
    borderColor: selected ? ORANGE_COLOR : alpha(BLUE_COLOR, 0.2),
    backgroundColor: selected ? alpha(ORANGE_COLOR, 0.06) : alpha(BLUE_COLOR, 0.02),
    transform: 'translateY(-4px)',
  },
}));

const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: selected ? ORANGE_COLOR : alpha(BLUE_COLOR, 0.05),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  color: selected ? '#fff' : alpha(BLUE_COLOR, 0.4),
  '& svg': {
    fontSize: '1.5rem',
  },
}));

const CheckBadge = styled(CheckCircleIcon)(({ theme }) => ({
  position: 'absolute',
  top: -6,
  right: -6,
  color: ORANGE_COLOR,
  fontSize: '1.2rem',
  backgroundColor: '#fff',
  borderRadius: '50%',
  zIndex: 1,
}));

const DISABLED_NOTIFICATIONS = ['sms', 'whatsapp', 'call'];

const ViewingScheduler: React.FC = () => {
  const { state, dispatch } = useBookViewing();

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        date: event.target.value,
      },
    });
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        time: event.target.value,
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

  const handleNotificationChange = (type: string) => {
    if (DISABLED_NOTIFICATIONS.includes(type)) return;

    const rawPreferences = state.viewingDetails?.notificationPreference;
    const current = Array.isArray(rawPreferences) ? rawPreferences : [];

    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];

    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        notificationPreference: updated,
      },
    });
  };

  const handleUserDetailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    dispatch({
      type: 'UPDATE_VIEWING_DETAILS',
      payload: {
        ...state.viewingDetails,
        userDetails: {
          ...state.viewingDetails?.userDetails,
          [name]: value,
        },
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
              Your Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <StyledTextField
                name="fullName"
                label="Full Name"
                value={state.viewingDetails?.userDetails?.fullName || ''}
                onChange={handleUserDetailsChange}
                fullWidth
                required
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <StyledTextField
                name="email"
                type="email"
                label="Email Address"
                value={state.viewingDetails?.userDetails?.email || ''}
                onChange={handleUserDetailsChange}
                fullWidth
                required
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <StyledTextField
                name="phoneNumber"
                label="Phone Number"
                value={state.viewingDetails?.userDetails?.phoneNumber || ''}
                onChange={handleUserDetailsChange}
                fullWidth
                required
              />
            </Box>

            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, mt: 4, fontWeight: 500 }}>
              Viewing Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <StyledTextField
                type="date"
                label="Select Date"
                value={state.viewingDetails?.date || ''}
                onChange={handleDateChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <StyledTextField
                type="time"
                label="Select Time"
                value={state.viewingDetails?.time || ''}
                onChange={handleTimeChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 minutes
                }}
              />
            </Box>

            <StyledTextField
              select
              fullWidth
              label="Viewing Preference"
              value={state.viewingDetails?.preference || ''}
              onChange={handlePreferenceChange}
              required
            >
              <MenuItem value="in-person">In-Person Viewing</MenuItem>
              <MenuItem value="virtual">Virtual Viewing</MenuItem>
            </StyledTextField>

            <Box sx={{ mt: 5, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ color: DARK_GREY, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span role="img" aria-label="notification">🔔</span> Booking Notifications
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: LIGHT_GREY, mb: 3 }}>
                Choose how you would like to receive booking updates.
              </Typography>

              <Stack
                direction="row"
                spacing={2}
                sx={{
                  width: '100%',
                  pt: 2, // Extra top padding for hover and badges
                  pb: 1,
                  px: 1, // Side padding to avoid badge cutoff
                  ml: -1, // Negate px padding for alignment
                  overflow: 'visible' // Ensure badges and hover transformations are not cut off
                }}
              >
                {[
                  { id: 'email', label: 'Email', sub: 'DETAILED', icon: <EmailIcon /> },
                  { id: 'sms', label: 'SMS', sub: 'INSTANT', icon: <SmsIcon /> },
                  { id: 'whatsapp', label: 'WhatsApp', sub: 'DIRECT', icon: <WhatsAppIcon /> },
                  { id: 'call', label: 'Call', sub: 'VOICE', icon: <PhoneIcon /> },
                ].map((option) => {
                  const isDisabled = DISABLED_NOTIFICATIONS.includes(option.id);
                  const isSelected = !isDisabled && Boolean(state.viewingDetails?.notificationPreference?.includes(option.id));
                  return (
                    <NotificationCard
                      key={option.id}
                      selected={isSelected}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      onClick={() => handleNotificationChange(option.id)}
                    >
                      {isSelected && <CheckBadge />}
                      <IconWrapper selected={isSelected}>
                        {option.icon}
                      </IconWrapper>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isSelected ? ORANGE_COLOR : DARK_GREY,
                          mb: 0.25
                        }}
                      >
                        {option.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: LIGHT_GREY,
                          fontSize: '0.65rem',
                          fontWeight: 500
                        }}
                      >
                        {option.sub}
                      </Typography>
                    </NotificationCard>
                  );
                })}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>
    </Box>
  );
};

export default ViewingScheduler;