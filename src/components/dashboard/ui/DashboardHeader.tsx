import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Paper,
  Grid,
  Button,
  styled
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { BLUE_COLOR } from '../Dashboard';

interface DashboardHeaderProps {
  userName: string;
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

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  marginRight: theme.spacing(3),
  backgroundColor: '#F5F6FA',
  border: '1px solid',
  borderColor: theme.palette.divider,
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

/**
 * Dashboard header component with user information and welcome message
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <HeaderPaper elevation={0}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ProfileAvatar 
              alt={userName}
              src="/images/avatar-placeholder.jpg"
            >
              {userName.charAt(0)}
            </ProfileAvatar>
            <Box sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight={500} sx={{ mr: 1 }}>
                  {userName}
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
              <Typography sx={{ color: '#374957' }}>TosinLanipekun@Luxcity.omnicrosoft</Typography>
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