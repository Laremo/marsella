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

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

export default function TeacherLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleTheme } = useColorTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Persistent Collapsible Sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: currentSidebarWidth,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: theme.zIndex.appBar,
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <TeacherSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
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
              width: EXPANDED_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
        >
          <TeacherSidebar onClose={handleDrawerToggle} isCollapsed={false} />
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
