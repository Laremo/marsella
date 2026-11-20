import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Paper,
  CircularProgress,
  useTheme,
  Button,
} from '@mui/material';
import {
  AdminPanelSettings as DirectorIcon,
  Dashboard as ExamsIcon,
  School as GroupsIcon,
  SportsEsports as QuizzesIcon,
  BarChart as AnalyticsIcon,
  Logout as LogoutIcon,
  CheckCircle as ActiveIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DirectorDashboardPage() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    examsCount: 0,
    groupsCount: 0,
    quizzesCount: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchDirectorStats = async () => {
      try {
        const [examsRes, groupsRes, quizzesRes] = await Promise.all([
          api.get('/teacher/exams'),
          api.get('/teacher/groups'),
          api.get('/teacher/quizzes'),
        ]);

        setStats({
          examsCount: examsRes.data?.length || 0,
          groupsCount: groupsRes.data?.length || 0,
          quizzesCount: quizzesRes.data?.length || 0,
          loading: false,
        });
      } catch (e) {
        console.error('Error fetching director stats', e);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDirectorStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    {
      title: 'Gestión de Exámenes Institucionales',
      description: 'Supervisa y revisa los exámenes creados por todos los docentes, sus preguntas y entregas de alumnos.',
      icon: <ExamsIcon sx={{ fontSize: 36 }} />,
      countLabel: `${stats.examsCount} Exámenes`,
      color: '#3B82F6',
      path: '/teacher/dashboard',
    },
    {
      title: 'Cursos, Grupos y Calificaciones',
      description: 'Accede a todos los cursos, grupos, grados, lista de estudiantes, listas de asistencia y sábanas de notas consolidadas.',
      icon: <GroupsIcon sx={{ fontSize: 36 }} />,
      countLabel: `${stats.groupsCount} Grupos`,
      color: '#10B981',
      path: '/teacher/groups',
    },
    {
      title: 'Quizzes y Dinámicas en Vivo',
      description: 'Visualiza todos los cuestionarios gamificados, reportes y métricas de desempeño de las sesiones.',
      icon: <QuizzesIcon sx={{ fontSize: 36 }} />,
      countLabel: `${stats.quizzesCount} Quizzes`,
      color: '#8B5CF6',
      path: '/teacher/quizzes',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* Top Banner */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DirectorIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                Panel de Dirección General
              </Typography>
              <Chip
                label="Directivo"
                size="small"
                color="primary"
                sx={{ fontWeight: 800, fontSize: '0.75rem', height: 24 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Visión global de todos los cursos, bloques, ciclos, exámenes y materias escolares.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
        >
          Cerrar Sesión
        </Button>
      </Box>

      {/* Metric Cards Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
              borderColor: isDark ? '#1e3a8a' : '#bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <ExamsIcon sx={{ fontSize: 36, color: '#3b82f6' }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                TOTAL DE EXÁMENES
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {stats.loading ? <CircularProgress size={20} /> : stats.examsCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
              borderColor: isDark ? '#065f46' : '#a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <GroupsIcon sx={{ fontSize: 36, color: '#10b981' }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                GRUPOS Y CURSOS ACTIVOS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {stats.loading ? <CircularProgress size={20} /> : stats.groupsCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#f5f3ff',
              borderColor: isDark ? '#5b21b6' : '#ddd6fe',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <QuizzesIcon sx={{ fontSize: 36, color: '#8b5cf6' }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                QUIZZES EN VIVO
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {stats.loading ? <CircularProgress size={20} /> : stats.quizzesCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Director Sections */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        Módulos del Sistema
      </Typography>

      <Grid container spacing={3}>
        {sections.map((sec, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 24px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)'}`,
                  borderColor: sec.color,
                },
              }}
            >
              <CardActionArea onClick={() => navigate(sec.path)} sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '10px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                      color: sec.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sec.icon}
                  </Box>
                  <Chip label={sec.countLabel} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {sec.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                  {sec.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
