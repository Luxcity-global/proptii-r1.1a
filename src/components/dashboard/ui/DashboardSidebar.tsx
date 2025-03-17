import React from 'react';
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
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS, BLUE_COLOR, DARK_GREY } from '../Dashboard';

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 220,
  flexShrink: 0,
  borderRight: '1px solid',
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

const NavList = styled(List)({
  padding: '8px',
  flexGrow: 1
});

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(1)
}));

/**
 * Dashboard sidebar component with navigation
 */
const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeSection,
  onSectionChange
}) => {
  const navigate = useNavigate();

  // Map section IDs to icons
  const getIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'dashboard':
        return <DashboardIcon />;
      case 'saved-searches':
        return <BookmarkIcon />;
      case 'favorites':
        return <FavoriteIcon />;
      case 'viewings':
        return <VisibilityIcon />;
      case 'referencing':
        return <AssignmentIcon />;
      case 'contracts':
        return <InsertDriveFileIcon />;
      case 'files':
        return <InsertDriveFileIcon />;
      default:
        return <DashboardIcon />;
    }
  };

  const handleNavClick = (sectionId: string, path: string) => {
    onSectionChange(sectionId);
    navigate(path);
  };

  return (
    <SidebarContainer>
      {/* Logo */}
      <LogoContainer>
        <img 
          src="/images/proptii-logo.png" 
          alt="Proptii" 
          style={{ height: 40, width: 'auto' }} 
        />
      </LogoContainer>

      <Divider />

      {/* Navigation Items */}
      <NavList>
        {DASHBOARD_SECTIONS.map((section) => (
          <ListItem key={section.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={activeSection === section.id}
              onClick={() => handleNavClick(section.id, section.path)}
              sx={{
                borderRadius: '8px',
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
              <ListItemIcon sx={{ 
                minWidth: '40px',
                color: activeSection === section.id ? BLUE_COLOR : DARK_GREY
              }}>
                {getIcon(section.id)}
              </ListItemIcon>
              <ListItemText 
                primary={section.label} 
                primaryTypographyProps={{ 
                  fontSize: '0.9rem',
                  fontWeight: activeSection === section.id ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </NavList>

      {/* Bottom Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: BLUE_COLOR }}>T</Avatar>
        </Box>
      </Box>
    </SidebarContainer>
  );
};

export default DashboardSidebar; 