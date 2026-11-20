import React from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  useTheme,
  Button,
} from '@mui/material';
import {
  School as CourseIcon,
  Assignment as ExamIcon,
  SportsEsports as QuizIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentActions = [
    {
      title: 'Gestión del Curso Actual',
      description: 'Consulta tus materias, asistencias, actividades escolares y calificaciones del ciclo.',
      icon: <CourseIcon sx={{ fontSize: { xs: 44, sm: 54 } }} />,
      color: '#2563EB',
      bgLight: 'rgba(37, 99, 235, 0.08)',
      bgDark: 'rgba(37, 99, 235, 0.2)',
      border: '#3B82F6',
      action: () => navigate('/teacher/groups'),
    },
    {
      title: 'Examen',
      description: 'Ingresa el código asignado por tu profesor y resuelve tu examen en línea.',
      icon: <ExamIcon sx={{ fontSize: { xs: 44, sm: 54 } }} />,
      color: '#10B981',
      bgLight: 'rgba(16, 185, 129, 0.08)',
      bgDark: 'rgba(16, 185, 129, 0.2)',
      border: '#10B981',
      action: () => navigate('/exam'),
    },
    {
      title: 'Quizz en Vivo',
      description: 'Únete a partidas interactivas en tiempo real introduciendo el PIN de la sesión.',
      icon: <QuizIcon sx={{ fontSize: { xs: 44, sm: 54 } }} />,
      color: '#8B5CF6',
      bgLight: 'rgba(139, 92, 246, 0.08)',
      bgDark: 'rgba(139, 92, 246, 0.2)',
      border: '#8B5CF6',
      action: () => navigate('/quiz/live'),
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 7 } }}>
      {/* Top Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 3, sm: 5 },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            ¡Hola, {user?.fullName || user?.username || 'Alumno'}! 👋
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Portal del Estudiante • Selecciona la sección a la que deseas acceder:
          </Typography>
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

      {/* 3 Large Action Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {studentActions.map((item, idx) => (
          <Card
            key={idx}
            sx={{
              borderRadius: '12px',
              border: `2px solid ${isDark ? item.border : item.border}`,
              boxShadow: isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.4)'
                : '0 4px 20px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 30px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}`,
              },
            }}
          >
            <CardActionArea onClick={item.action} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2.5, sm: 3.5 } }}>
                <Box
                  sx={{
                    width: { xs: 68, sm: 84 },
                    height: { xs: 68, sm: 84 },
                    borderRadius: '12px',
                    bgcolor: isDark ? item.bgDark : item.bgLight,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: 'text.primary',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      mb: 0.8,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
