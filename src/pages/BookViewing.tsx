import React, { useState } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, styled } from '@mui/material';
import { BookViewingModal } from '../components/viewings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { Navbar } from '../components/common/Navbar';

// Constants
const BLUE_COLOR = '#136C9E';
const DARK_GREY = '#333333';

// Styled Components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'transparent',
  color: 'white',
  height: '80vh',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("/images/hero-book-viewing.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 1,
    zIndex: 1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    opacity: 0.7,
    zIndex: 1,
  }
}));

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  maxWidth: 800,
  margin: '0 auto',
  padding: theme.spacing(0, 2),
}));

const StepCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'all 0.3s ease-in-out',
  borderRadius: '12px',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[4],
    borderColor: BLUE_COLOR,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 48,
    color: BLUE_COLOR,
    marginBottom: theme.spacing(2),
  }
}));

const BookViewing: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const steps = [
    {
      icon: <SearchIcon />,
      title: 'Find Your Property',
      description: 'Browse through our extensive collection of properties or paste a property URL to get started.'
    },
    {
      icon: <CalendarMonthIcon />,
      title: 'Schedule Viewing',
      description: 'Choose your preferred date and time from available slots. We handle all the coordination.'
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Requirements Check',
      description: 'Our AI analyzes property compatibility with your requirements and suggests alternatives.'
    },
    {
      icon: <CompareArrowsIcon />,
      title: 'Compare & Decide',
      description: 'Compare viewed properties side by side and make an informed decision.'
    }
  ];

  return (
    <Box>
      <Navbar />
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <Typography variant="h1" sx={{ 
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            fontWeight: 700,
            mb: 3,
            lineHeight: 1.2
          }}>
            Skip the Hassle and Book Property Viewings with Proptii AI
          </Typography>
          <Typography variant="h2" sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 4,
            opacity: 0.9
          }}>
            We make finding and securing your home easy, every step of the way
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleOpenModal}
            sx={{
              backgroundColor: '#E65D24',
              color: 'white',
              '&:hover': {
                backgroundColor: '#d54d1a',
              },
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: '30px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Get Started
          </Button>
        </HeroContent>
      </HeroSection>

      {/* Steps Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" sx={{ 
          textAlign: 'center',
          mb: 6,
          color: DARK_GREY,
          fontWeight: 600
        }}>
          Steps to Book Viewing
        </Typography>
        <Typography variant="h3" sx={{ 
          textAlign: 'center',
          mb: 8,
          color: 'text.secondary',
          maxWidth: 800,
          mx: 'auto'
        }}>
          Streamline Your Home Search Experience
          <br />
          Dive into property details, schedule personalized viewings, and navigate your real estate journey with confidence.
        </Typography>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StepCard elevation={2}>
                {step.icon}
                <Typography variant="h4" sx={{ 
                  mb: 2,
                  color: DARK_GREY,
                  fontWeight: 600
                }}>
                  {step.title}
                </Typography>
                <Typography color="text.secondary">
                  {step.description}
                </Typography>
              </StepCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Book Viewing Modal */}
      <BookViewingModal
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </Box>
  );
};

export default BookViewing; 