import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Paper,
  Stack,
  IconButton
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../context/AuthContext';
import ReferencingModal from '../components/referencing/ReferencingModal';
import { ReferencingProvider } from '../components/referencing/context/ReferencingContext';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import FAQSection from '../components/FAQSection';

// Import hero image
const HERO_IMAGE_URL = '/images/pablo-merchan-montes-wYOPqmtDD0w-unsplash.jpg';

export const ReferencingPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const handleStartReferencing = () => {
    if (!propertyId) {
        setIsModalOpen(true);
      return;
    }

    if (user) {
      setIsModalOpen(true);
    } else {
      window.location.href = `/login?returnUrl=/referencing/${propertyId}`;
    }
  };

  const handlePrevSlide = () => {
    setActiveStep((prevActiveStep) => Math.max(0, prevActiveStep - 1));
  };

  const handleNextSlide = () => {
    setActiveStep((prevActiveStep) => Math.min(steps.length - 1, prevActiveStep + 1));
  };

  const steps = [
    {
      title: '01. Review the Document Checklist',
      description: 'Ensure you have all the required documents organized and ready for submission.',
      icon: 'document-checklist'
    },
    {
      title: '02. Upload Your Documents',
      description: 'Ensure you have all the required documnts organized and ready for Submission',
      icon: 'upload-documents'
    },
    {
      title: '03. Respond to Any Follow-Ups',
      description: 'Ensure you have all the required documents organized and ready for submission',
      icon: 'follow-ups'
    },
    {
      title: '04. Receive Feedback',
      description: 'Ensure you have all the required documents organized and ready for submission',
      icon: 'receive-feedback'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <Box
        sx={{
          backgroundImage: `url(${HERO_IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '80vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            height: '100%', 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <Box sx={{ color: 'white', maxWidth: '800px' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '2.5rem', md: '3.75rem' },
                lineHeight: { xs: 1.2, md: 1.1 },
                mb: 3
              }}
            >
            Verify Your Identity,<br />
            Funds, and Rental History
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                fontWeight: 400,
                opacity: 0.9,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                lineHeight: 1.4,
                maxWidth: '650px',
                mx: 'auto'
              }}
            >
              Ensure peace of mind for both landlords and tenants. Our rigorous
              referencing process verifies renter or buyer identity, financial status, and
              rental history
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartReferencing}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 500,
                backgroundColor: '#E65D24',
                '&:hover': {
                  backgroundColor: '#d54d1a',
                },
                borderRadius: '30px',
                textTransform: 'none'
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Steps Section */}
      <Box sx={{ py: 8, backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Background shapes */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '320px',
            height: '320px',
            backgroundColor: '#FFF5E1',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '384px',
            height: '384px',
            backgroundColor: '#F6F8FD',
            borderRadius: '50%',
            transform: 'translate(33%, 33%)',
            zIndex: 0
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6}>
            {/* Left Column - Text Content */}
            <Grid item xs={12} md={5}>
              <Box>
                <Typography 
                  variant="h3" 
                  component="h2"
                  sx={{ 
                    color: '#136C9E',
                    fontWeight: 600,
                    mb: 3,
                    fontFamily: 'Archivo'
                  }}
                >
                  Steps for referencing
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: '#666666',
                    mb: 4,
                    fontSize: '1.125rem',
                    lineHeight: 1.6
                  }}
                >
                  Once successfully verified, users are issued a digital "Rent Passport," a secure
                  badge of trustworthiness. This streamlined process fosters trust and
                  confidence in every property transaction.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleStartReferencing}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: '#E65D24',
                    '&:hover': {
                      backgroundColor: '#d54d1a',
                    },
                    borderRadius: '30px',
                    textTransform: 'none'
                  }}
                >
                  Get started
                </Button>
              </Box>
            </Grid>

            {/* Right Column - Carousel */}
            <Grid item xs={12} md={7}>
              <Box sx={{ position: 'relative' }}>
                {/* Navigation Arrows */}
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    left: -20, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#136C9E',
                    '&:hover': { backgroundColor: 'rgba(19, 108, 158, 0.1)' },
                    visibility: activeStep === 0 ? 'hidden' : 'visible'
                  }}
                  onClick={handlePrevSlide}
                  disabled={activeStep === 0}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    right: -20, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#136C9E',
                    '&:hover': { backgroundColor: 'rgba(19, 108, 158, 0.1)' },
                    visibility: activeStep === steps.length - 1 ? 'hidden' : 'visible'
                  }}
                  onClick={handleNextSlide}
                  disabled={activeStep === steps.length - 1}
                >
                  <ChevronRightIcon />
                </IconButton>

                {/* Carousel Content */}
                <Box 
                  sx={{ 
                    backgroundColor: '#136C9E',
                    borderRadius: 2,
                    p: 4,
                    color: 'white',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box 
                      sx={{ 
                        width: 80,
                        height: 80,
                        backgroundColor: 'white',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        mb: 2
                      }}
                    >
                      <img 
                        src={`/images/referencing-steps/${steps[activeStep].icon}.svg`}
                        alt={steps[activeStep].title}
                        style={{ width: '40px', height: '40px' }}
                      />
                    </Box>
                    <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                      {steps[activeStep].title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {steps[activeStep].description}
                    </Typography>
                  </Box>

                  {/* Dots Navigation */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 'auto' }}>
                    {steps.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: index === activeStep ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveStep(index)}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
      
      {!propertyId && (
        <ReferencingProvider propertyId={null}>
          <ReferencingModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            propertyId={null}
          />
        </ReferencingProvider>
      )}

      {propertyId && (
        <ReferencingProvider propertyId={propertyId}>
      <ReferencingModal 
            open={isModalOpen}
        onClose={() => setIsModalOpen(false)} 
            propertyId={propertyId}
      />
        </ReferencingProvider>
      )}
    </Box>
  );
};