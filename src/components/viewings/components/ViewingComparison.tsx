import React from 'react';
import {
  Box,
  Typography,
  styled,
  Paper,
  Grid,
  alpha,
  Divider
} from '@mui/material';
import { useBookViewing } from '../context/BookViewingContext';
import { format } from 'date-fns';

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

const InfoSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: DARK_GREY,
  fontWeight: 500,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.5),
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: DARK_GREY,
  fontSize: '1rem',
}));

const ViewingComparison: React.FC = () => {
  const { state } = useBookViewing();
  const { selectedProperty, viewingDetails } = state;

  const formatAddress = () => {
    const parts = [
      selectedProperty?.buildingName,
      selectedProperty?.street,
      selectedProperty?.city,
      selectedProperty?.postcode
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionTitle variant="h6">Review Details</SectionTitle>
      <SectionDescription variant="body2">
        Please review all the information before submitting your viewing request.
      </SectionDescription>

      <StyledPaper>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, fontWeight: 500 }}>
              Property Details
            </Typography>
            
            <InfoSection>
              <InfoLabel>Property Address</InfoLabel>
              <InfoValue>{formatAddress()}</InfoValue>
            </InfoSection>

            <InfoSection>
              <InfoLabel>Estate Agent</InfoLabel>
              <InfoValue>{selectedProperty?.agent?.name || 'Not specified'}</InfoValue>
              <InfoValue>{selectedProperty?.agent?.email || 'No email provided'}</InfoValue>
              <InfoValue>{selectedProperty?.agent?.phone || 'No phone provided'}</InfoValue>
            </InfoSection>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ color: DARK_GREY, mb: 2, fontWeight: 500 }}>
              Viewing Details
            </Typography>

            <InfoSection>
              <InfoLabel>Viewing Date</InfoLabel>
              <InfoValue>
                {viewingDetails?.date ? format(new Date(viewingDetails.date), 'PPPP') : 'Not selected'}
              </InfoValue>
            </InfoSection>

            <InfoSection>
              <InfoLabel>Viewing Time</InfoLabel>
              <InfoValue>
                {viewingDetails?.time ? format(new Date(viewingDetails.time), 'HH:mm') : 'Not selected'}
              </InfoValue>
            </InfoSection>

            <InfoSection>
              <InfoLabel>Viewing Type</InfoLabel>
              <InfoValue>
                {viewingDetails?.preference === 'in-person' ? 'In-Person Viewing' : 
                 viewingDetails?.preference === 'virtual' ? 'Virtual Viewing' : 
                 'Not specified'}
              </InfoValue>
            </InfoSection>
          </Grid>
        </Grid>
      </StyledPaper>
    </Box>
  );
};

export default ViewingComparison;

