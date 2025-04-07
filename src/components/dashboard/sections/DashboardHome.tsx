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
  alpha,
  collapseClasses
} from '@mui/material';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Cell, PieChart, Pie } from 'recharts';
import { Link } from 'react-router-dom';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { formatCurrency, formatDate, formatFileSize } from '../../../utils/formatters';


const DashboardCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  overflow: 'hidden',
  height: '400px',
  display: 'flex',
  flexDirection: 'row',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
}));

const CardSidebar = styled(Box)(({ theme }) => ({
  backgroundColor: '#4E97CC',
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
  width: '100%',
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

  const data = [
    { name: 'Total', value: dashboardSummary?.viewings.total || 0 },
    { name: 'Completed', value: dashboardSummary?.viewings.past || 0 },
    { name: 'Upcoming', value: dashboardSummary?.viewings.upcoming || 0 }
  ];

  

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  const referencingProgress = (dashboardSummary?.referencing.completedSteps || 0);
  const completedSteps = dashboardSummary?.referencing.completedSteps || 0;
  const totalSteps = dashboardSummary?.referencing.totalSteps || 1; // Avoid division by zero

  // Calculate the progress as a fraction of the total steps
  const progressFraction = completedSteps / totalSteps;

  // Calculate the strokeDashoffset based on the progress fraction
  const strokeDashoffset = 251 * (1 - progressFraction);
  ;
  return (
    <Grid container spacing={3} bgcolor={'#EDF3FA'} padding={3} height={'100%'}>
      {/* Saved Listings Card */}
      <Grid item xs={12} md={6}  >
        <DashboardCard>
          <CardSidebar>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
              <Box sx={{ display: 'flex', flexDirection:'column', alignItems: 'start' }}>
                <IconWrapper  style={{ width: '34px', height: '34px' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1919_20247)">
                <path d="M20.5185 8.09305L13.8115 1.3852C12.9815 0.557544 11.8571 0.0927734 10.6849 0.0927734C9.51267 0.0927734 8.38829 0.557544 7.5582 1.3852L0.851233 8.09305C0.604022 8.33868 0.408025 8.63094 0.274604 8.95288C0.141183 9.27482 0.0729927 9.62004 0.0739853 9.96853V18.6491C0.0739853 19.3527 0.353468 20.0274 0.85095 20.5249C1.34843 21.0224 2.02316 21.3018 2.72671 21.3018H18.643C19.3466 21.3018 20.0213 21.0224 20.5188 20.5249C21.0163 20.0274 21.2958 19.3527 21.2958 18.6491V9.96853C21.2968 9.62004 21.2286 9.27482 21.0951 8.95288C20.9617 8.63094 20.7657 8.33868 20.5185 8.09305ZM13.3376 19.5334H8.03215V16.0548C8.03215 15.3512 8.31163 14.6765 8.80912 14.179C9.3066 13.6815 9.98133 13.402 10.6849 13.402C11.3884 13.402 12.0632 13.6815 12.5606 14.179C13.0581 14.6765 13.3376 15.3512 13.3376 16.0548V19.5334ZM19.5273 18.6491C19.5273 18.8836 19.4341 19.1085 19.2683 19.2744C19.1025 19.4402 18.8776 19.5334 18.643 19.5334H15.1061V16.0548C15.1061 14.8822 14.6403 13.7576 13.8111 12.9285C12.982 12.0994 11.8574 11.6336 10.6849 11.6336C9.5123 11.6336 8.38775 12.0994 7.55861 12.9285C6.72947 13.7576 6.26367 14.8822 6.26367 16.0548V19.5334H2.72671C2.49219 19.5334 2.26728 19.4402 2.10145 19.2744C1.93563 19.1085 1.84247 18.8836 1.84247 18.6491V9.96853C1.84329 9.73418 1.93636 9.50959 2.10155 9.34337L8.80852 2.63817C9.30696 2.14205 9.98161 1.86353 10.6849 1.86353C11.3881 1.86353 12.0628 2.14205 12.5612 2.63817L19.2682 9.34602C19.4327 9.51159 19.5258 9.7351 19.5273 9.96853V18.6491Z" fill="#3F2E00"/>
                </g>
                
                  </svg>

                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
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
          
          <CardContent >
            <GoToButton to="/dashboard/saved-searches">
            Go to Saved Searches
              <NorthEastIcon />
            </GoToButton>
            
            {savedProperties.slice(0, 4).map((property) => (
              <PropertyListItem key={property.id} height={'35%'} >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%',  }}>
                  <PropertyImage
                    src="/images/detached-house.jpg"
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
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
          <Box sx={{ display: 'flex', flexDirection:'column', alignItems: 'start' }}>
                <IconWrapper style={{ width: '34px', height: '34px' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1919_20405)">
              <path d="M20.6509 8.40288C19.2795 6.16929 16.1599 2.42188 10.6846 2.42188C5.20943 2.42188 2.08982 6.16929 0.718367 8.40288C0.294398 9.08861 0.0698242 9.87889 0.0698242 10.6851C0.0698242 11.4913 0.294398 12.2816 0.718367 12.9673C2.08982 15.2009 5.20943 18.9483 10.6846 18.9483C16.1599 18.9483 19.2795 15.2009 20.6509 12.9673C21.0749 12.2816 21.2995 11.4913 21.2995 10.6851C21.2995 9.87889 21.0749 9.08861 20.6509 8.40288ZM19.1433 12.0415C17.9655 13.9568 15.2995 17.1799 10.6846 17.1799C6.06979 17.1799 3.40381 13.9568 2.226 12.0415C1.97411 11.6339 1.84069 11.1643 1.84069 10.6851C1.84069 10.206 1.97411 9.73627 2.226 9.32868C3.40381 7.41341 6.06979 4.19036 10.6846 4.19036C15.2995 4.19036 17.9655 7.40988 19.1433 9.32868C19.3952 9.73627 19.5286 10.206 19.5286 10.6851C19.5286 11.1643 19.3952 11.6339 19.1433 12.0415Z" fill="#584414"/>
              <path d="M10.6844 6.26367C9.80996 6.26367 8.95516 6.52297 8.2281 7.00878C7.50104 7.49459 6.93436 8.18508 6.59973 8.99295C6.2651 9.80082 6.17754 10.6898 6.34814 11.5474C6.51873 12.405 6.93981 13.1928 7.55813 13.8111C8.17644 14.4295 8.96423 14.8505 9.82186 15.0211C10.6795 15.1917 11.5684 15.1042 12.3763 14.7695C13.1842 14.4349 13.8747 13.8682 14.3605 13.1412C14.8463 12.4141 15.1056 11.5593 15.1056 10.6849C15.1042 9.51273 14.6379 8.389 13.8091 7.56016C12.9803 6.73133 11.8565 6.26508 10.6844 6.26367ZM10.6844 13.3376C10.1597 13.3376 9.64685 13.182 9.21062 12.8905C8.77438 12.599 8.43437 12.1847 8.23359 11.7C8.03281 11.2153 7.98028 10.6819 8.08264 10.1674C8.18499 9.65278 8.43764 9.18011 8.80863 8.80912C9.17962 8.43813 9.65229 8.18548 10.1669 8.08312C10.6814 7.98077 11.2148 8.0333 11.6995 8.23408C12.1843 8.43486 12.5986 8.77486 12.89 9.2111C13.1815 9.64734 13.3371 10.1602 13.3371 10.6849C13.3371 11.3884 13.0576 12.0632 12.5601 12.5606C12.0627 13.0581 11.3879 13.3376 10.6844 13.3376Z" fill="#584414"/>
                </g>

              </svg>

                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                  Viewings
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                    {dashboardSummary?.viewings.total || 0}
                </StatsNumber>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Viewings
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
            
            {/* {upcomingViewings.slice(0, 3).map((viewing) => (
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
            ))} */}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
              Viewings Summary
              </Typography>
                { <Box sx={{ display: 'flex', flex:'row', justifyContent: 'start', alignItems: 'end', gap:3, height: '100%', pt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ height: `${(dashboardSummary?.viewings.total || 0) * 30}px`, width: 50, bgcolor: '#C4A86E', borderRadius: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Typography variant="body2" color="black" sx={{ mb: 1 }}>
                  {dashboardSummary?.viewings.total || 0}
                  </Typography>
                  </Box>
                </Box>
                
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'center', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ height: `${(dashboardSummary?.viewings.past || 0) * 30}px`, width: 50, bgcolor: '#E1C387', borderRadius: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Typography variant="body2" color="black" sx={{ mb: 1 }}>
                  {dashboardSummary?.viewings.past || 0}
                  </Typography>
                  </Box>
                </Box>
                
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'center', mt: 2 }}>
                <Box sx={{ textAlign: 'center', pr: 3 }}>
                  <Box sx={{ height: `${(dashboardSummary?.viewings.upcoming || 0) * 30}px`, width: 50, bgcolor: '#FEDFA0', borderRadius: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Typography variant="body2" color="black" sx={{ mb: 1 }}>
                  {dashboardSummary?.viewings.upcoming || 0}
                  </Typography>
                  </Box>
                </Box>
                </Box>

                
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#C4A86E', mr: 1 }} />
                  <Typography variant="body2">Total Viewings</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#E1C387', mr: 1 }} />
                  <Typography variant="body2">Completed Viewings</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FEDFA0', mr: 1 }} />
                  <Typography variant="body2">Upcoming Viewings</Typography>
                  </Box>
                </Box>
                
                </Box> }
              
                {/* <BarChart width={300} height={200} data={data} >
                  <CartesianGrid strokeDasharray="1 1" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart> */}
          </Box>
            
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
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <Box sx={{ display: 'flex', flexDirection:'column', alignItems: 'start' }}>
                <IconWrapper style={{ width: '34px', height: '34px' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1919_20416)">
                <path d="M17.3477 2.83484L15.8834 1.36876C15.4737 0.956985 14.9864 0.630546 14.4497 0.408341C13.9131 0.186137 13.3376 0.0725776 12.7567 0.0742367H7.14801C5.97587 0.0756407 4.85213 0.541896 4.0233 1.37073C3.19447 2.19956 2.72821 3.32329 2.72681 4.49544V16.8748C2.72821 18.047 3.19447 19.1707 4.0233 19.9995C4.85213 20.8284 5.97587 21.2946 7.14801 21.296H14.2219C15.3941 21.2946 16.5178 20.8284 17.3466 19.9995C18.1755 19.1707 18.6417 18.047 18.6431 16.8748V5.96063C18.6446 5.37984 18.5308 4.80454 18.3085 4.26801C18.0861 3.73147 17.7596 3.24435 17.3477 2.83484ZM16.0974 4.08515C16.2228 4.21011 16.3351 4.34759 16.4325 4.49544H14.2219V2.28484C14.3695 2.38327 14.5072 2.4958 14.6331 2.62085L16.0974 4.08515ZM16.8747 16.8748C16.8747 17.5784 16.5952 18.2531 16.0977 18.7506C15.6002 19.248 14.9255 19.5275 14.2219 19.5275H7.14801C6.44446 19.5275 5.76973 19.248 5.27225 18.7506C4.77477 18.2531 4.49529 17.5784 4.49529 16.8748V4.49544C4.49529 3.79189 4.77477 3.11716 5.27225 2.61968C5.76973 2.1222 6.44446 1.84272 7.14801 1.84272H12.4535V4.49544C12.4535 4.96447 12.6398 5.41429 12.9714 5.74594C13.3031 6.0776 13.7529 6.26392 14.2219 6.26392H16.8747V16.8748ZM14.2219 8.0324C14.4565 8.0324 14.6814 8.12556 14.8472 8.29139C15.013 8.45722 15.1062 8.68213 15.1062 8.91664C15.1062 9.15116 15.013 9.37607 14.8472 9.54189C14.6814 9.70772 14.4565 9.80088 14.2219 9.80088H7.14801C6.9135 9.80088 6.68859 9.70772 6.52276 9.54189C6.35693 9.37607 6.26377 9.15116 6.26377 8.91664C6.26377 8.68213 6.35693 8.45722 6.52276 8.29139C6.68859 8.12556 6.9135 8.0324 7.14801 8.0324H14.2219ZM15.1062 12.4536C15.1062 12.6881 15.013 12.913 14.8472 13.0789C14.6814 13.2447 14.4565 13.3378 14.2219 13.3378H7.14801C6.9135 13.3378 6.68859 13.2447 6.52276 13.0789C6.35693 12.913 6.26377 12.6881 6.26377 12.4536C6.26377 12.2191 6.35693 11.9942 6.52276 11.8284C6.68859 11.6625 6.9135 11.5694 7.14801 11.5694H14.2219C14.4565 11.5694 14.6814 11.6625 14.8472 11.8284C15.013 11.9942 15.1062 12.2191 15.1062 12.4536ZM14.9364 15.4715C15.0739 15.6606 15.1308 15.8964 15.0949 16.1274C15.0589 16.3584 14.933 16.5658 14.7445 16.7041C13.8486 17.3425 12.7875 17.7088 11.6886 17.7591C11.0465 17.756 10.424 17.5381 9.9201 17.1401C9.63007 16.9411 9.51954 16.8748 9.30114 16.8748C8.70996 16.9663 8.15217 17.208 7.68121 17.5769C7.49441 17.7101 7.26317 17.7654 7.03632 17.7313C6.80948 17.6971 6.60478 17.5762 6.46545 17.3939C6.32613 17.2117 6.26308 16.9824 6.28963 16.7545C6.31618 16.5267 6.43025 16.3181 6.60774 16.1727C7.38691 15.5678 8.32253 15.1979 9.30467 15.1063C9.8937 15.1157 10.4631 15.3193 10.9246 15.6855C11.135 15.8747 11.4058 15.9828 11.6886 15.9906C12.4116 15.9364 13.1069 15.6894 13.702 15.2752C13.8918 15.1377 14.1284 15.0811 14.3598 15.1179C14.5913 15.1547 14.7987 15.2819 14.9364 15.4715Z" fill="#584414"/>
                  </g>

                </svg>

                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                  Referencing
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <StatsNumber>
                  {dashboardSummary?.referencing.progress || 0}
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
          
          <CardContent >
            <GoToButton to="/dashboard/tenant-referencing">
              Go to Referencing
              <NorthEastIcon />
            </GoToButton>
            
            <Box sx={{ mt: 4, mb: 1, display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: 2 }}>
              {/*<Box 
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
              >*}
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: 'rgba(56, 142, 60, 0.1)', 
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>
                  <img src="/images/protection-shield-icon-3d-render-illustration.png" alt="Placeholder" style={{ width: '50%', height: 'auto', objectFit: 'contain' }} />
                </Box>*/}
                
              
              <Box>
                <Typography variant="caption" sx={{ mt: 3, textAlign: 'center', fontSize: '1.2rem', fontWeight: 549,paddingTop: 2 }}> 
                  {referencingProgress === 0 ? "Not started yet" : 
                   referencingProgress === 1 ? "You're Just Getting Started" : 
                   referencingProgress === 2 ? "Making Progress" : 
                   referencingProgress === 3 ? "Halfway There" : 
                   referencingProgress === 4 ? "Almost Done" : 
                   referencingProgress === 5 ? "Just One More Step" : 
                   "Congratulations! Your referencing is complete!"}
                </Typography>
              </Box>
            </Box>
            
            {/*<Typography variant="body2" textAlign="left" sx={{ mt: 2 }}>
              <Box component="span" sx={{ color: 'green', fontWeight: 'bold' }}>
              {dashboardSummary?.referencing.completedSteps || 0}
              </Box> 
              {' '}out of{' '}
              <Box component="span" sx={{ color: 'green', fontWeight: 'bold' }}>
              {dashboardSummary?.referencing.totalSteps || 0}
              </Box> 
              {' '}steps complete
            </Typography>
            
            {/* <Box sx={{ mt: 2, display: 'flex', gap: 1, paddingBottom: 1 }}>
              {[...Array(6)].map((_, index) => (
              <Box 
              key={index} 
              sx={{ 
              flexGrow: 1, 
              height: 8, 
              borderRadius: 4, 
              bgcolor: index < referencingProgress ? '#4DA41A' : 'rgba(19, 108, 158, 0.1)'
              }} 
              />
              ))}
            </Box> */}
            
            

            <Box
      sx={{
      mt: 2,
      mb: 4,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center', // Center the torus and text together
      alignItems: 'center',
      gap: 12, // Add spacing between the torus and the text
      position: 'relative',
      }}
>
      {/* Pie Chart (Torus) */}
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center',   alignItems: 'center' }}>
      <PieChart width={200} height={200}>
      <Pie
        data={[
          { name: 'Identity', value: 1 },
          { name: 'Employment', value: 1 },
          { name: 'Residential', value: 1 },
          { name: 'Financial', value: 1 },
          { name: 'Guarantor', value: 1 },
          { name: 'Agent Details', value: 1 },
        ]}
        cx="50%"
        cy="50%"
        innerRadius={60} // Added innerRadius to create a torus shape
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
      >
        <Cell key="Identity" fill={dashboardSummary?.referencing.identity ? "#4CAF50" : "#F9A876"} />
        <Cell key="Employment" fill={dashboardSummary?.referencing.employment ? "#4CAF50" : "#F9A876"} />
        <Cell key="Residential" fill={dashboardSummary?.referencing.residential ? "#4CAF50" : "#F9A876"} />
        <Cell key="Financial" fill={dashboardSummary?.referencing.financial ? "#4CAF50" : "#F9A876"} />
        <Cell key="Guarantor" fill={dashboardSummary?.referencing.guarantor ? "#4CAF50" : "#F9A876"} />
        <Cell key="Agent Details" fill={dashboardSummary?.referencing.agentDetails ? "#4CAF50" : "#F9A876"} />
      </Pie>
      </PieChart>

      {/* Middle Content */}
      <div
      className="relative w-300px h-300px mx-auto"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
      <svg viewBox="0 0 100 100" className="w-full h-full" >
        <defs>
          <pattern id="image" patternUnits="userSpaceOnUse" width="100" height="100">
            <image href="/images/shield.png" x="-176" y="-171" width="450" height="450" />
          </pattern>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="50"
          stroke="orange"
          strokeWidth="0"
          fill="url(#image)"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white"
        style={{ width: '100%', height: '100%' }}
      >
        {referencingProgress === 6 ? (
          <svg
            width="50"
            height="50"
            viewBox="-2 -5 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '40%', height: '40%' }}
          >
            <g clipPath="url(#clip0_1726_13952)">
              <path
                d="M25.5372 11.3595C25.2208 11.0993 24.7425 10.7061 24.6879 10.502C24.6267 10.2727 24.8418 9.69612 24.9988 9.27507C25.3028 8.45934 25.6477 7.53463 25.1924 6.74773C24.7316 5.95136 23.75 5.78801 22.8838 5.64381C22.4712 5.57501 21.8477 5.47119 21.6882 5.31175C21.5288 5.15231 21.425 4.52877 21.3562 4.11617C21.212 3.24996 21.0484 2.2684 20.2521 1.80759C19.4656 1.35235 18.5407 1.69718 17.7247 2.00123C17.3039 2.1582 16.7271 2.37284 16.498 2.31187C16.2939 2.25728 15.9007 1.77896 15.6403 1.46255C15.0767 0.777214 14.4377 0 13.5 0C12.5623 0 11.9233 0.777214 11.3595 1.46276C11.0993 1.77917 10.7061 2.25748 10.502 2.31207C10.2725 2.37305 9.69612 2.1582 9.27507 2.00123C8.45934 1.69718 7.53463 1.35235 6.74773 1.80759C5.95136 2.2684 5.78801 3.24996 5.64381 4.11617C5.57501 4.52877 5.47119 5.15231 5.31175 5.31175C5.15231 5.47119 4.52877 5.57501 4.11617 5.64381C3.24996 5.78801 2.2684 5.95157 1.80759 6.74794C1.35235 7.53463 1.69718 8.45934 2.00123 9.27528C2.1582 9.69612 2.37305 10.2729 2.31187 10.502C2.25728 10.7061 1.77896 11.0993 1.46255 11.3597C0.777214 11.9233 0 12.5623 0 13.5C0 14.4377 0.777214 15.0767 1.46276 15.6405C1.77917 15.9007 2.25748 16.2939 2.31207 16.498C2.37325 16.7273 2.1582 17.3039 2.00123 17.7249C1.69718 18.5407 1.35235 19.4654 1.80759 20.2523C2.2684 21.0486 3.24996 21.212 4.11617 21.3562C4.52877 21.425 5.15231 21.5288 5.31175 21.6882C5.47119 21.8477 5.57501 22.4712 5.64381 22.8838C5.78801 23.75 5.95157 24.7316 6.74794 25.1924C7.53442 25.6477 8.45934 25.3028 9.27528 24.9988C9.69612 24.8418 10.2731 24.6272 10.502 24.6881C10.7061 24.7427 11.0993 25.221 11.3597 25.5374C11.9233 26.2228 12.5623 27 13.5 27C14.4377 27 15.0767 26.2228 15.6405 25.5372C15.9007 25.2208 16.2939 24.7425 16.498 24.6879C16.7275 24.6272 17.3039 24.8418 17.7249 24.9988C18.5407 25.3026 19.4654 25.6477 20.2523 25.1924C21.0486 24.7316 21.212 23.75 21.3562 22.8838C21.425 22.4712 21.5288 21.8477 21.6882 21.6882C21.8477 21.5288 22.4712 21.425 22.8838 21.3562C23.75 21.212 24.7316 21.0484 25.1924 20.2521C25.6477 19.4654 25.3028 18.5407 24.9988 17.7247C24.8418 17.3039 24.627 16.7271 24.6881 16.498C24.7427 16.2939 25.221 15.9007 25.5374 15.6403C26.2228 15.0767 27 14.4377 27 13.5C27 12.5623 26.2228 11.9233 25.5372 11.3595Z" fill="white"/>
                <path d="M25.4831 11.3595C25.1549 11.0993 24.6589 10.7061 24.6023 10.502C24.5388 10.2727 24.7619 9.69612 24.9247 9.27507C25.24 8.45934 25.5976 7.53463 25.1255 6.74773C24.6476 5.95136 23.6297 5.78801 22.7314 5.64381C22.3035 5.57501 21.6569 5.47119 21.4915 5.31175C21.3262 5.15231 21.2185 4.52877 21.1472 4.11617C20.9976 3.24996 20.828 2.2684 20.0021 1.80759C19.1865 1.35235 18.2274 1.69718 17.3812 2.00123C16.9448 2.1582 16.3466 2.37284 16.1091 2.31187C15.8974 2.25728 15.4896 1.77896 15.2195 1.46255C14.6351 0.777214 13.9724 0 13 0V27C13.9724 27 14.6351 26.2228 15.2198 25.5372C15.4896 25.2208 15.8974 24.7425 16.1091 24.6879C16.347 24.6272 16.9448 24.8418 17.3814 24.9988C18.2274 25.3026 19.1863 25.6477 20.0023 25.1924C20.8282 24.7316 20.9976 23.75 21.1472 22.8838C21.2185 22.4712 21.3262 21.8477 21.4915 21.6882C21.6569 21.5288 22.3035 21.425 22.7314 21.3562C23.6297 21.212 24.6476 21.0484 25.1255 20.2521C25.5976 19.4654 25.24 18.5407 24.9247 17.7247C24.7619 17.3039 24.5391 16.7271 24.6025 16.498C24.6591 16.2939 25.1552 15.9007 25.4833 15.6403C26.194 15.0767 27 14.4377 27 13.5C27 12.5623 26.194 11.9233 25.4831 11.3595Z" fill="#F5F5F5"/>
                <path d="M19.7096 10.0913C19.6311 9.54212 19.3435 9.05618 18.8996 8.7235C18.4559 8.39061 17.909 8.25054 17.3598 8.32881C16.8106 8.4073 16.3249 8.69507 15.992 9.13878L12.7556 13.4537L11.3336 12.0318C10.5239 11.222 9.20635 11.222 8.39638 12.0318C7.58662 12.8415 7.58662 14.1593 8.39638 14.969L11.5118 18.0843C11.904 18.4767 12.4256 18.6926 12.9804 18.6926C13.0294 18.6926 13.0788 18.6909 13.1276 18.6874C13.7285 18.6448 14.2806 18.3438 14.6419 17.8618L19.3151 11.6311C19.648 11.1872 19.788 10.6405 19.7096 10.0913Z" fill="#2A6C00"
              />
            </g>
          </svg>
        ) : (
          <StatsNumber style={{ zIndex: 20, fill: 'white' }}>{referencingProgress}</StatsNumber>
        )}
      </div>
      </div>
     </Box>

      {/* Text Beside the Torus */}
      <Box>
      {(['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails']   as const).map((section) => (
      <Box key={section} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: dashboardSummary?.referencing[section] ? '#4CAF50' : 'transparent',
            border: `2px solid ${dashboardSummary?.referencing[section] ? '#4CAF50' : '#ccc'}`,
          }}
        >
          {dashboardSummary?.referencing[section] && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              width="12px"
              height="12px"
            >
              <path d="M9 16.2l-4.2-4.2L3 13.8l6 6 12-12-1.8-1.8z" />
            </svg>
          )}
        </Box>
        <Typography variant="body2" sx={{ ml: 1 }}>
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </Typography>
      </Box>
      ))}
      </Box>
      </Box>
            <Box sx={{ mt: 'auto', width: '100%' }}>
              <Button 
              component={Link}
              to="/referencing"
              variant="outlined" 
              fullWidth 
              sx={{ 
              borderRadius: 1,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500
              }}
              >
              Resume Process
              </Button>
            </Box>
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Contracts Card */}
      <Grid item xs={12} md={6}>
        <DashboardCard>
          <CardSidebar>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
              <Box sx={{ display: 'flex', flexDirection:'column', alignItems: 'start' }}>
                <IconWrapper style={{ width: '34px', height: '34px' }}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1919_20427)">
                <path d="M15.1059 12.4536C15.1059 12.6881 15.0127 12.913 14.8469 13.0789C14.6811 13.2447 14.4562 13.3378 14.2217 13.3378H7.14773C6.91321 13.3378 6.6883 13.2447 6.52248 13.0789C6.35665 12.913 6.26349 12.6881 6.26349 12.4536C6.26349 12.2191 6.35665 11.9942 6.52248 11.8284C6.6883 11.6625 6.91321 11.5694 7.14773 11.5694H14.2217C14.4562 11.5694 14.6811 11.6625 14.8469 11.8284C15.0127 11.9942 15.1059 12.2191 15.1059 12.4536ZM11.5689 15.1063H7.14773C6.91321 15.1063 6.6883 15.1995 6.52248 15.3653C6.35665 15.5311 6.26349 15.7561 6.26349 15.9906C6.26349 16.2251 6.35665 16.45 6.52248 16.6158C6.6883 16.7817 6.91321 16.8748 7.14773 16.8748H11.5689C11.8034 16.8748 12.0284 16.7817 12.1942 16.6158C12.36 16.45 12.4532 16.2251 12.4532 15.9906C12.4532 15.7561 12.36 15.5311 12.1942 15.3653C12.0284 15.1995 11.8034 15.1063 11.5689 15.1063ZM19.5271 9.3455V16.8748C19.5257 18.047 19.0594 19.1707 18.2306 19.9995C17.4018 20.8284 16.278 21.2946 15.1059 21.296H6.26349C5.09134 21.2946 3.96761 20.8284 3.13878 19.9995C2.30994 19.1707 1.84369 18.047 1.84229 16.8748V4.49544C1.84369 3.3233 2.30994 2.19956 3.13878 1.37073C3.96761 0.541898 5.09134 0.0756432 6.26349 0.0742391H10.2558C11.069 0.0721462 11.8745 0.231269 12.6258 0.542408C13.3771 0.853548 14.0592 1.31053 14.6328 1.88693L17.7135 4.9694C18.2903 5.5426 18.7475 6.22454 19.0588 6.97572C19.3701 7.72689 19.5293 8.53238 19.5271 9.3455ZM13.3825 3.13725C13.1042 2.8677 12.7918 2.63582 12.4532 2.44754V6.26392C12.4532 6.49844 12.5463 6.72335 12.7122 6.88918C12.878 7.055 13.1029 7.14816 13.3374 7.14816H17.1538C16.9654 6.80967 16.7332 6.49749 16.4632 6.21971L13.3825 3.13725ZM17.7586 9.3455C17.7586 9.1996 17.7303 9.05989 17.7171 8.91665H13.3374C12.6339 8.91665 11.9591 8.63716 11.4617 8.13968C10.9642 7.6422 10.6847 6.96747 10.6847 6.26392V1.88428C10.5414 1.87102 10.4009 1.84272 10.2558 1.84272H6.26349C5.55994 1.84272 4.88521 2.1222 4.38773 2.61968C3.89025 3.11717 3.61077 3.7919 3.61077 4.49544V16.8748C3.61077 17.5784 3.89025 18.2531 4.38773 18.7506C4.88521 19.2481 5.55994 19.5275 6.26349 19.5275H15.1059C15.8094 19.5275 16.4842 19.2481 16.9817 18.7506C17.4791 18.2531 17.7586 17.5784 17.7586 16.8748V9.3455Z" fill="#584414"/>
                </g>

                  </svg>

                </IconWrapper>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
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
            <GoToButton to="/dashboard/tenant-contracts">
              Go to Contracts
              <NorthEastIcon />
            </GoToButton>
            
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', justifyContent:'center', borderRadius: 2, p: 2, paddingTop:8, gap: 3 }} height={'90%'}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 3, 
                bgcolor: '#EDF3FA', 
                border: '1px solid',
                borderColor: 'divider',
                width: '100%'
              }}>
                <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-betwe', alignItems: 'center', gap: 2 }} >
                  <span style={{ fontWeight: 'bold', color: '#15507B', fontSize: '1.7rem' }}>{dashboardSummary?.contracts.requested || 0}</span>
                  <span>Requested Contracts:</span>
                  <Button  
                    component={Link}
                    to="/dashboard/tenant-contracts?signed=true"
                    variant="outlined" 
                    size="small" 
                    sx={{ ml: 2, width: '200px' }}
                    >
                  View Requested Contracts
                  </Button>
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 2, 
                borderRadius: 3, 
                bgcolor: '#EDF3FA', 
                border: '1px solid',
                borderColor: 'divider',
                width: '100%',
                mt: 2
              }}>
                <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'sart', alignItems: 'center', gap: 1 }} >
                    <span style={{ fontWeight: 'bold', color: '#15507B', fontSize: '1.7rem' }}>{dashboardSummary?.contracts.total || 0}</span>
                    <span style={{ paddingRight: '24px' }}>Signed Contracts:</span>
                    <Button 
                    component={Link}
                    to="/dashboard/tenant-contracts?signed=true"
                    variant="outlined" 
                    size="small" 
                    sx={{ ml: 2, width: '200px' }}
                    >
                    View Signed Contracts
                    </Button>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </DashboardCard>
      </Grid>

      {/* Files Section */}
      <div className='Files Section' style={{ display: 'flex', flexDirection: 'column',  borderRadius: '8px', paddingLeft: '30,', paddingTop:'30px', paddingBottom:'30px', width: '100%', backgroundColor:'' }} >
      <Grid item xs={12} height={'10px'} width={'100%'}  > 
        
          <CardContent bgcolor={'#EDF3FA'} borderRadius={4} >
            <div style={{ display:'flex', flexDirection:'row', justifyContent:'start', alignItems:'start', backgroundColor: '#F5F5F5', padding: '12px', borderRadius: '6px', width: '100%',}}>
            <Typography variant="h6" color='#374957' fontWeight="bold">Uploaded Files</Typography>
            </div>
            <Grid container spacing={2} sx={{ mt: 2 }} height={'100%'} width={'100%'}>
       {files.slice(0, 8).map((file) => (
       <Grid item xs={6} sm={3} md={2} lg={1.5} key={file.id} width={'100%'}>
       <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          cursor: 'pointer', // Add pointer cursor to indicate clickability
        }}
        onClick={() => window.open(file.url, '_blank')} // Open the file in a new tab
        >
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
            mb: 1,
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
      
        
      </Grid>
      </div>
    </Grid>
    
  );
};

// Helper functions for file display
const getBarColor = (entry: { name: string }): string => {
  if (entry.name === 'Total') return '#8884d8';
  if (entry.name === 'Completed') return '#82ca9d';
  if (entry.name === 'Upcoming') return '#ffc658';
  return '#8884d8';
};

const getFileColorByType = (type: string): string => {
  if (type.includes('pdf')) {
    return 'rgba(244, 67, 54, 0.1)';
  } else if (type.includes('image')) {
    return 'rgba(33, 150, 243, 0.1)';
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