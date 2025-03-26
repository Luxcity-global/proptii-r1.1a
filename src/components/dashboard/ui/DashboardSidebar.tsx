import React, { useState } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS, BLUE_COLOR, DARK_GREY } from '../Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <ListItem key={section.id} disablePadding sx={{ mb: isCollapsed ? 2 : 0.5 }}>
      <ListItemButton
        selected={activeSection === section.id}
        onClick={() => handleNavClick(section.id, section.path)}
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
            color: activeSection === section.id ? BLUE_COLOR : DARK_GREY,
            justifyContent: 'center', // Center the icon
            alignItems: 'center', // Center the icon
            display: 'flex', // Ensure the icon is flexed
          }}
        >
          {section.icon(activeSection === section.id)}
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText
            primary={section.label}
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: activeSection === section.id ? 600 : 400,
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
    p: 2,
    display: 'flex',
    flexDirection: isCollapsed ? 'column' : 'column', // Stack horizontally when collapsed, vertically when expanded
    justifyContent: isCollapsed ? 'center' : 'start', // Align to start when expanded, center when collapsed
    alignItems: 'start', // Center vertically
  }}
>
  
  <IconButton onClick={toggleSidebar}>
    <MenuIcon />
  </IconButton>
  <Avatar
      sx={{
        width: 38,
        height: 38,
        bgcolor: BLUE_COLOR,
      }}
    >
      T
  </Avatar>
</Box>


      
      {/* Bottom Actions */}
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
      display: 'flex',
      flexDirection: isCollapsed ? 'column' : 'row', // Stack vertically when collapsed, horizontally when expanded
      alignItems: 'center', // Always center the icons within the group
      justifyContent: 'center', // Center the icons within the group
      gap: 1, // Add spacing between icons
    }}
  >
    <Tooltip title="Settings">
      <IconButton size="small">
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Refresh">
      <IconButton size="small">
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>

  
</Box>
    </SidebarContainer>
  );
};

export default DashboardSidebar;