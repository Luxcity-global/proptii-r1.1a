import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Paper,
  Grid,
  Button,
  styled,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { BLUE_COLOR } from '../Dashboard';
import { useAuth } from '../../../contexts/AuthContext';

interface DashboardHeaderProps {
  userName?: string; // Make optional since we'll get it from auth context
}

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  borderRadius: 12,
  marginBottom: theme.spacing(3),
  backgroundColor: 'white',
  border: '1px rgb(233, 233, 233) solid',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
}));

// Function to generate gradient colors based on user name with deep, rich colors
const generateGradientColors = (name: string): string => {
  const colors = [
    'linear-gradient(135deg, #232526 0%, #414345 100%)', // deep gray/black
    'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)', // deep blue
    'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)', // blue/teal
    'linear-gradient(135deg, #200122 0%, #6f0000 100%)', // deep purple/red
    'linear-gradient(135deg, #373b44 0%, #4286f4 100%)', // blue/gray
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)', // navy
    'linear-gradient(135deg, #42275a 0%, #734b6d 100%)', // purple
    'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', // teal/green
    'linear-gradient(135deg, #000428 0%, #004e92 100%)', // deep blue
    'linear-gradient(135deg, #870000 0%, #190a05 100%)', // deep red/brown
  ];
  // Use the name to consistently select a gradient
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  marginRight: theme.spacing(3),
  border: '1px solid',
  borderColor: theme.palette.divider,
  fontSize: '2rem',
  fontWeight: 700,
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  '& img': {
    objectFit: 'cover'
  }
}));

const VerifiedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(56, 142, 60, 0.1)',
  color: theme.palette.success.main,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: theme.palette.success.main
  }
}));

const ContactItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
  '& svg': {
    marginRight: theme.spacing(1),
    
    fontSize: '1rem'
  },
  '& .MuiTypography-root': {
    
    fontSize: '0.875rem'
  }
}));

const PropWiseButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.background.default,
  },
  boxShadow: 'none',
  borderRadius: '60px',
  padding: '6px 16px',
  fontWeight: 500,
  textTransform: 'none'
}));

const Logo = styled('img')({
  height: 40,
  marginRight: 'auto'
});

/**
 * Dashboard header component with user information and welcome message
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  const { user } = useAuth();
  
  // Use authenticated user data or fallback to prop
  const displayName = user?.name || userName || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userPhone = '+44 7911 123456'; // Default phone number
  
  // Generate initials from the user's name
  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  const initials = getInitials(displayName);
  const gradientBackground = generateGradientColors(displayName);
  
  return (
    <HeaderPaper elevation={0}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ProfileAvatar 
              alt={displayName}
              sx={{ 
                background: gradientBackground,
                color: '#fff'
              }}
            >
              {initials}
            </ProfileAvatar>
            <Box sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight={500} sx={{ mr: 1 }}>
                  {displayName}
                </Typography>
                <VerifiedChip
                  icon={<VerifiedIcon />}
                  label="Verified"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Welcome to your personalised dashboard
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Middle Column - Contact Info */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: { xs: 'flex-start', md: 'start' },
            height: '100%',
            justifyContent: 'center'
          }}>
            <ContactItem>
              <Box 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#DBE8FC', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingLeft: 1,
            marginRight: 1 
          }}
              >
          <PhoneIcon sx={{ color: '#3B63B5' }} />
              </Box>
              <Typography sx={{ color: '#374957' }}>+44 7911 123456</Typography>
            </ContactItem>
            
            <ContactItem>
              <Box 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#DBE8FC', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingLeft: 1,
            marginRight: 1
          }}
              >
          <EmailIcon sx={{ color: '#3B63B5' }} />
              </Box>
              <Typography sx={{ color: '#374957' }}>{userEmail}</Typography>
            </ContactItem>
          </Box>
        </Grid>

        {/* Right Column - PropWise Button */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center',
            height: '100%'
          }}>
            <PropWiseButton
              variant="contained"
              startIcon={<Box component="span" sx={{ width: 20, height: 20, bgcolor: BLUE_COLOR, borderRadius: '50%' }} />}
              endIcon={<span>✨</span>}
            >
              PropWise
            </PropWiseButton>
          </Box>
        </Grid>
      </Grid>
    </HeaderPaper>
  );
};

export default DashboardHeader; 