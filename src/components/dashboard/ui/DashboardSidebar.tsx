import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  styled,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS, BLUE_COLOR, DARK_GREY } from '../Dashboard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const SidebarContainer = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  borderRight: '1px solid',
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'width 0.3s',
}));

const NavList = styled(List)(() => ({
  padding: '8px',
  flexGrow: 1,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md')); // Detect tablet view
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Automatically collapse the sidebar in tablet view
  useEffect(() => {
    setIsCollapsed(isTablet);
  }, [isTablet]);

  const handleNavClick = (sectionId: string, path: string) => {
    onSectionChange(sectionId);
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContainer sx={{ width: isCollapsed ? 60 : 220 }}>
      {/* Logo */}
      <LogoContainer>
        <IconButton onClick={() => navigate('/referencing')}>
          <img
            src={isCollapsed ? '/images/Proptii ico.png' : '/images/proptii-logo.png'}
            alt="Proptii"
            style={{ height: 40, width: 'auto' }}
          />
        </IconButton>
      </LogoContainer>

      <Divider />

      {/* Navigation Items */}
      <NavList
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed ? '1px' : '2px', // Increase gap when collapsed
        }}
      >
        {DASHBOARD_SECTIONS.map((section) => (
          <ListItem key={section?.id ?? ''} disablePadding sx={{ mb: isCollapsed ? 2 : 0.5 }}>
            <ListItemButton
              selected={activeSection === section?.id}
              onClick={() => section && handleNavClick(section.id, section.path)}
              sx={{
                borderRadius: '8px',
                justifyContent: isCollapsed ? 'center' : 'flex-start', // Center the button when collapsed
                '&.Mui-selected': {
                  backgroundColor: 'rgba(19, 108, 158, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(19, 108, 158, 0.15)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: BLUE_COLOR,
                  },
                  '& .MuiListItemText-primary': {
                    color: BLUE_COLOR,
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: '40px',
                  color: activeSection === section?.id ? BLUE_COLOR : DARK_GREY,
                  justifyContent: 'center', // Center the icon
                  alignItems: 'center', // Center the icon
                  display: 'flex', // Ensure the icon is flexed
                }}
              >
                {section?.icon?.(activeSection === section?.id)}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={section?.label ?? ''}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: activeSection === section?.id ? 600 : 400,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </NavList>

      {/* Collapse/Expand Button */}
      <Box
        sx={{
          p: 1,
          gap: 1,
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'column',
          justifyContent: isCollapsed ? 'center' : 'start',
          alignItems: 'start',
        }}
      >
        <Tooltip title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
          <IconButton onClick={toggleSidebar}>
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box
  sx={{
    p: 2,
    borderTop: '1px solid',
    borderColor: 'divider',
    display: 'flex',
    flexDirection: isCollapsed ? 'row' : 'column', // Stack horizontally when collapsed, vertically when expanded
    alignItems: isCollapsed ? 'center' : 'flex-start', // Center when collapsed, align to start when expanded
    justifyContent: isCollapsed ? 'center' : 'flex-start', // Center when collapsed, align to start when expanded
    gap: 2, // Add spacing between items
  }}
>
  {/* Grouped Settings and Refresh Icons */}
  <Box
    sx={{
      
      width:'100%',
      display: 'flex',
      flexDirection: isCollapsed ? 'column' : 'row', // Stack vertically when collapsed, horizontally when expanded
      alignItems: 'center', // Always center the icons within the group
      justifyContent: 'center', // Center the icons within the group
      gap: 1, // Add spacing between icons
    }}
  >
    {/* Add the new button here */}
    <Button
      variant="outlined"
      onClick={() => navigate('/')}
      startIcon={
        <svg
          width="18"
          height="18"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_1919_20247)">
            <path
              d="M20.5185 8.09305L13.8115 1.3852C12.9815 0.557544 11.8571 0.0927734 10.6849 0.0927734C9.51267 0.0927734 8.38829 0.557544 7.5582 1.3852L0.851233 8.09305C0.604022 8.33868 0.408025 8.63094 0.274604 8.95288C0.141183 9.27482 0.0729927 9.62004 0.0739853 9.96853V18.6491C0.0739853 19.3527 0.353468 20.0274 0.85095 20.5249C1.34843 21.0224 2.02316 21.3018 2.72671 21.3018H18.643C19.3466 21.3018 20.0213 21.0224 20.5188 20.5249C21.0163 20.0274 21.2958 19.3527 21.2958 18.6491V9.96853C21.2968 9.62004 21.2286 9.27482 21.0951 8.95288C20.9617 8.63094 20.7657 8.33868 20.5185 8.09305ZM13.3376 19.5334H8.03215V16.0548C8.03215 15.3512 8.31163 14.6765 8.80912 14.179C9.3066 13.6815 9.98133 13.402 10.6849 13.402C11.3884 13.402 12.0632 13.6815 12.5606 14.179C13.0581 14.6765 13.3376 15.3512 13.3376 16.0548V19.5334ZM19.5273 18.6491C19.5273 18.8836 19.4341 19.1085 19.2683 19.2744C19.1025 19.4402 18.8776 19.5334 18.643 19.5334H15.1061V16.0548C15.1061 14.8822 14.6403 13.7576 13.8111 12.9285C12.982 12.0994 11.8574 11.6336 10.6849 11.6336C9.5123 11.6336 8.38775 12.0994 7.55861 12.9285C6.72947 13.7576 6.26367 14.8822 6.26367 16.0548V19.5334H2.72671C2.49219 19.5334 2.26728 19.4402 2.10145 19.2744C1.93563 19.1085 1.84247 18.8836 1.84247 18.6491V9.96853C1.84329 9.73418 1.93636 9.50959 2.10155 9.34337L8.80852 2.63817C9.30696 2.14205 9.98161 1.86353 10.6849 1.86353C11.3881 1.86353 12.0628 2.14205 12.5612 2.63817L19.2682 9.34602C19.4327 9.51159 19.5258 9.7351 19.5273 9.96853V18.6491Z"
              fill="#DC5F12"
            />
          </g>
        </svg>
      }
      sx={{
        height: '44px',
        color: '#DC5F12',
        borderColor: '#DC5F12',
        borderRadius: '32px',
        textTransform: 'none',
        fontSize: '0.8rem',
        fontWeight: 500,
        justifyContent: 'center',
        width: isCollapsed ? '20px' : '100%', // Adjust width based on collapsed state
        maxWidth: isCollapsed ? '60px' : 'none', // Limit width when collapsed
        minWidth: isCollapsed ? '40px' : 'none', // Limit width when collapsed
        paddingLeft: isCollapsed ? '27px' : '0px', // Adjust padding when collapsed
        
        '&:hover': {
          borderColor: '#DC5F12',
          backgroundColor: 'rgba(220, 95, 18, 0.1)',
        },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {!isCollapsed && 'Proptii Home'}
    </Button>
  </Box>
</Box>

    </SidebarContainer>
  );
};

export default DashboardSidebar;
