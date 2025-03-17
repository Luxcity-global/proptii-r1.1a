import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  LinearProgress, 
  styled,
  IconButton,
  CircularProgress,
  Alert,
  alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { BLUE_COLOR } from '../Dashboard';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { formatCurrency, formatDate, formatFileSize } from '../../../utils/formatters';

const DashboardCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
}));

const CardSidebar = styled(Box)(({ theme }) => ({
  backgroundColor: '#2f7db0',
  color: theme.palette.common.white,
  padding: theme.spacing(3),
  width: '33.33%',
  display: 'flex',
  flexDirection: 'column'
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  flexGrow: 1,
  backgroundColor: '#FFFFFF',
  width: '66.67%',
  position: 'relative'
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: '50%',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1.5),
  '& svg': {
    color: '#2f7db0',
    fontSize: '1.2rem'
  }
}));

const StatsNumber = styled(Typography)(({ theme }) => ({
  fontSize: '2.1rem',
  fontWeight: 700,
  color: theme.palette.common.white,
  marginBottom: theme.spacing(1)
}));

const PropertyListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const GoToButton = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  textTransform: 'none',
  fontSize: '0.875rem',
  padding: '4px 12px',
  color: '#2f7db0',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: 'transparent',
    color: '#1b4a69',
    fontWeight: 600
  },
  '& .MuiSvgIcon-root': {
    marginLeft: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    backgroundColor: '#eeeff4',
    borderRadius: '50%',
    fontSize: '1rem'
  }
}));

const PropertyImage = styled('img')({
  width: 70,
  height: 50,
  borderRadius: 4,
  objectFit: 'cover'
});

/**
 * Main dashboard home page component
 */
const DashboardHome: React.FC = () => {
  const { 
    isLoading, 
    error, 
    dashboardSummary, 
    savedProperties, 
    viewings,
    upcomingViewings,
    files 
  } = useDashboardData();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Saved Listings Card */}
      <Grid item xs={12} md={6}>
        <DashboardCard>
          <CardSidebar>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconWrapper>
                  <HomeIcon />
                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                  Saved Listings
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                  {dashboardSummary?.savedSearches.count || 0}
                </StatsNumber>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Listings
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  As of {formatDate(new Date().toISOString())}
                </Typography>
              </Box>
            </Box>
          </CardSidebar>
          
          <CardContent>
            <GoToButton to="/dashboard/saved-searches">
              Go to Saved Listings
              <NorthEastIcon />
            </GoToButton>
            
            {savedProperties.slice(0, 4).map((property) => (
              <PropertyListItem key={property.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <PropertyImage
                    src="/images/house-placeholder.jpg"
                    alt={property.address}
                  />
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {formatCurrency(property.price)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {property.address}, {property.city}
                    </Typography>
                  </Box>
                </Box>
              </PropertyListItem>
            ))}
            
            {savedProperties.length === 0 && (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No saved properties found
                </Typography>
              </Box>
            )}
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Viewings Card */}
      <Grid item xs={12} md={6}>
        <DashboardCard>
          <CardSidebar>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconWrapper>
                  <VisibilityIcon />
                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                  Viewings
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                  {dashboardSummary?.viewings.upcoming || 0}
                </StatsNumber>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Upcoming Viewings
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  Next on {dashboardSummary?.viewings.nextViewing?.date || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardSidebar>
          
          <CardContent>
            <GoToButton to="/dashboard/viewings">
              Go to Viewings
              <NorthEastIcon />
            </GoToButton>
            
            {upcomingViewings.slice(0, 3).map((viewing) => (
              <PropertyListItem key={viewing.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <PropertyImage
                    src="/images/house-placeholder.jpg"
                    alt={viewing.propertyAddress}
                  />
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {viewing.propertyAddress}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {viewing.date} at {viewing.time}
                    </Typography>
                  </Box>
                </Box>
              </PropertyListItem>
            ))}
            
            {upcomingViewings.length === 0 && (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No upcoming viewings
                </Typography>
              </Box>
            )}
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Referencing Card */}
      <Grid item xs={12} md={6}>
        <DashboardCard>
          <CardSidebar>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconWrapper>
                  <ArticleIcon />
                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                  Referencing
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                  {dashboardSummary?.referencing.progress || 0}%
                </StatsNumber>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Reference Progress
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  as of {formatDate(new Date().toISOString())}
                </Typography>
              </Box>
            </Box>
          </CardSidebar>
          
          <CardContent>
            <GoToButton to="/dashboard/referencing">
              Go to Referencing
              <NorthEastIcon />
            </GoToButton>
            
            <Box sx={{ mt: 4, mb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box 
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '2px solid',
                  borderColor: 'rgba(56, 142, 60, 0.2)',
                  borderRadius: '50%'
                }}
              >
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: 'rgba(56, 142, 60, 0.1)', 
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <ArticleIcon color="success" />
                </Box>
              </Box>
            </Box>
            
            <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
              {dashboardSummary?.referencing.completedSteps || 0} out of {dashboardSummary?.referencing.totalSteps || 0} steps complete
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={dashboardSummary?.referencing.progress || 0} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 2,
                  bgcolor: 'rgba(19, 108, 158, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: BLUE_COLOR
                  }
                }} 
              />
            </Box>
            
            <Box sx={{ mt: 'auto', width: '100%' }}>
              <Button 
                component={Link}
                to="/dashboard/referencing"
                variant="outlined" 
                fullWidth 
                sx={{ 
                  borderRadius: 1,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                {dashboardSummary?.referencing.nextStep ? `Next: ${dashboardSummary.referencing.nextStep}` : 'Resume Process'}
              </Button>
            </Box>
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Contracts Card */}
      <Grid item xs={12} md={6}>
        <DashboardCard>
          <CardSidebar>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconWrapper>
                  <ArticleIcon />
                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                  Contracts
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                  {dashboardSummary?.contracts.pending || 0}
                </StatsNumber>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Pending Contracts
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  As of {formatDate(new Date().toISOString())}
                </Typography>
              </Box>
            </Box>
          </CardSidebar>
          
          <CardContent>
            <GoToButton to="/dashboard/contracts">
              Go to Contracts
              <NorthEastIcon />
            </GoToButton>
            
            <Box sx={{ my: 3 }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'rgba(0, 0, 0, 0.02)', 
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Requested Contracts:</span>
                  <span>{dashboardSummary?.contracts.requested || 0}</span>
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'rgba(0, 0, 0, 0.02)', 
                border: '1px solid',
                borderColor: 'divider',
                mt: 2
              }}>
                <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Contracts:</span>
                  <span>{dashboardSummary?.contracts.total || 0}</span>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Files Section */}
      <Grid item xs={12}>
        <DashboardCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>Uploaded Files</Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {files.slice(0, 8).map((file) => (
                <Grid item xs={6} sm={3} md={2} lg={1.5} key={file.id}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center'
                  }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        bgcolor: getFileColorByType(file.type),
                        borderRadius: 2,
                        mb: 1
                      }}
                    >
                      {getFileIconByType(file.type)}
                    </Paper>
                    <Typography variant="caption" textAlign="center" noWrap sx={{ maxWidth: 100 }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 100 }}>
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
              
              {files.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No files uploaded yet
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </DashboardCard>
      </Grid>
    </Grid>
  );
};

// Helper functions for file display
const getFileColorByType = (type: string): string => {
  if (type.includes('pdf')) {
    return 'rgba(244, 67, 54, 0.1)';
  } else if (type.includes('image')) {
    return 'rgba(56, 142, 60, 0.1)';
  } else {
    return 'rgba(33, 150, 243, 0.1)';
  }
};

const getFileIconByType = (type: string) => {
  if (type.includes('pdf')) {
    return <PictureAsPdfIcon sx={{ color: '#F44336' }} />;
  } else if (type.includes('image')) {
    return <ImageIcon sx={{ color: '#388E3C' }} />;
  } else {
    return <InsertDriveFileIcon sx={{ color: '#2196F3' }} />;
  }
};

export default DashboardHome; 