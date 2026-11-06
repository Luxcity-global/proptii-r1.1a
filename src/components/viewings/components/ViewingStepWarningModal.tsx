import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

const BLUE_COLOR = '#136C9E';

interface ViewingStepWarningModalProps {
  messages: string[];
  open: boolean;
  onClose: () => void;
}

export const ViewingStepWarningModal: React.FC<ViewingStepWarningModalProps> = ({
  messages,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          [theme.breakpoints.down('sm')]: {
            margin: 2,
            maxWidth: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1, sm: 1.5 },
            color: '#DC5F12',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Warning sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Missing Information
            </Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 1 }}>
            Please complete the following information before continuing:
          </Typography>
          <ul
            style={{
              marginLeft: 0,
              paddingLeft: isMobile ? '16px' : '20px',
              marginBottom: 0,
            }}
          >
            {messages.map((message, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {message}
                </Typography>
              </li>
            ))}
          </ul>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: BLUE_COLOR,
            '&:hover': {
              bgcolor: BLUE_COLOR,
              opacity: 0.9,
            },
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewingStepWarningModal;
