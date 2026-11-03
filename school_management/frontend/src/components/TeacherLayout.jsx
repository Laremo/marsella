import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import TeacherSidebar from './TeacherSidebar';
import { useColorTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_WIDTH = 260;

export default function TeacherLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleTheme } = useColorTheme();
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Persistent Sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: theme.zIndex.appBar,
          }}
        >
          <TeacherSidebar />
        </Box>
      )}

      {/* Mobile Temporary Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: SIDEBAR_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
        >
          <TeacherSidebar onClose={handleDrawerToggle} />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Mobile Top Header (only visible on mobile screens) */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              borderBottom: `1px solid ${theme.palette.divider}`,
              color: 'text.primary',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Marsella Docentes
                </Typography>
              </Box>

              <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                <IconButton onClick={toggleTheme} size="small" sx={{ borderRadius: '8px' }}>
                  {isDark ? (
                    <LightModeIcon sx={{ color: '#FBBF24', fontSize: 20 }} />
                  ) : (
                    <DarkModeIcon sx={{ color: '#1B254B', fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
        )}

        {/* Page Content */}
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
