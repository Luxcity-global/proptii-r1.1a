import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const BLUE_COLOR = '#136C9E';

interface ViewingSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export const ViewingSuccessModal: React.FC<ViewingSuccessModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Viewing Request Submitted</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mt: 2 }}>
          Your viewing request has been submitted successfully. The estate agent will contact you shortly to confirm the viewing.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: BLUE_COLOR,
            '&:hover': {
              bgcolor: BLUE_COLOR,
              opacity: 0.9,
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewingSuccessModal;
