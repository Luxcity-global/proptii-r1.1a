import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  styled
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

// Constants
const BLUE_COLOR = '#136C9E';

const TimeSlotButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: '100px',
  borderRadius: 20,
  textTransform: 'none',
  borderColor: theme.palette.divider,
  '&.Mui-selected': {
    backgroundColor: BLUE_COLOR,
    color: 'white',
    '&:hover': {
      backgroundColor: BLUE_COLOR,
      opacity: 0.9
    }
  }
}));

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const ViewingScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      console.log('Scheduled viewing for:', format(selectedDate, 'PPP'), 'at', selectedTime);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Schedule Your Viewing
      </Typography>

      <Grid container spacing={4}>
        {/* Date Selection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Date
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                sx={{ width: '100%' }}
                disablePast
                views={['year', 'month', 'day']}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>

        {/* Time Selection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Time
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {timeSlots.map((time) => (
                <TimeSlotButton
                  key={time}
                  variant="outlined"
                  onClick={() => handleTimeSelect(time)}
                  className={selectedTime === time ? 'Mui-selected' : ''}
                >
                  {time}
                </TimeSlotButton>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Confirmation */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime}
              sx={{
                bgcolor: BLUE_COLOR,
                '&:hover': {
                  bgcolor: BLUE_COLOR,
                  opacity: 0.9
                }
              }}
            >
              Confirm Schedule
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ViewingScheduler; 