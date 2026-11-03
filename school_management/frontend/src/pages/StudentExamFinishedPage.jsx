import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Home as HomeIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  LockClock as LockClockIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useColorTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function StudentExamFinishedPage() {
  const { submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDark, toggleTheme } = useColorTheme();

  const localSaved = (() => {
    if (!submissionId) return null;
    try {
      return JSON.parse(sessionStorage.getItem(`exam_submitted_${submissionId}`) || 'null');
    } catch (e) {
      return null;
    }
  })();

  const initialSession = location.state?.session || localSaved?.session;
  const initialResult = location.state?.result || localSaved?.result;

  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(!initialSession && !initialResult);

  useEffect(() => {
    if (!initialSession && !initialResult && submissionId) {
      api.get(`/student/exams/${submissionId}`)
        .then((res) => {
          setBackendData(res.data);
          sessionStorage.setItem(`exam_submitted_${submissionId}`, JSON.stringify({
            result: res.data,
            examTitle: res.data.examTitle,
            studentName: res.data.studentName,
          }));
        })
        .catch((err) => {
          console.error('Error fetching submission result', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialSession, initialResult, submissionId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const result = initialResult || backendData;
  const session = initialSession || (backendData ? { ...backendData, submissionId } : null);

  const examTitle = location.state?.examTitle || localSaved?.examTitle || session?.examTitle || result?.examTitle || 'Examen';
  const studentName = location.state?.studentName || localSaved?.studentName || session?.studentName || result?.studentName || 'Alumno';
  const block = session?.block || result?.block || 1;
  const grade = session?.grade || result?.grade;
  const groupName = session?.groupName || result?.groupName;
  const endDate = result?.endDate || session?.endDate;

  const canViewScore = Boolean(result?.canViewScore ?? session?.canViewScore ?? false);
  const score = result?.score !== undefined && result.score !== null ? result.score : session?.score !== undefined && session?.score !== null ? session.score : 0;
  const maxScore = result?.maxScore !== undefined ? result.maxScore : session?.totalPoints !== undefined ? session.totalPoints : 0;
  const percentage = result?.percentage !== undefined && result.percentage !== null ? result.percentage : (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);

  const formatCdmx = (date) => {
    if (!date) return dayjs().tz('America/Mexico_City').format('DD/MM/YYYY HH:mm:ss');
    return dayjs(date).tz('America/Mexico_City').format('DD/MM/YYYY HH:mm:ss');
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
      {/* Top Floating Theme Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton
            size="small"
            onClick={toggleTheme}
            sx={{
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {isDark ? <LightModeIcon sx={{ color: '#FBBF24', fontSize: 18 }} /> : <DarkModeIcon sx={{ color: '#1B254B', fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ textAlign: 'center', p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
        <CardContent>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 76,
              height: 76,
              borderRadius: '50%',
              bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
              color: 'success.main',
              my: 2,
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)',
            }}
          >
            <SuccessIcon sx={{ fontSize: 44 }} />
          </Box>

          {/* Bloque y Metadatos */}
          <Typography variant="overline" sx={{ fontWeight: 900, color: 'secondary.main', letterSpacing: 1.5, display: 'block' }}>
            Examen del bloque {block}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            ¡Examen Entregado con Éxito!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Tus respuestas han sido procesadas y guardadas correctamente en el sistema escolar.
          </Typography>

          {/* Score card: Only shown if the exam is closed/inactive (past deadline) */}
          {canViewScore ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                bgcolor: isDark ? 'rgba(30, 43, 77, 0.4)' : '#f8fafc',
                borderRadius: '10px',
                borderColor: theme.palette.divider,
              }}
            >
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.5 }}>
                Calificación Obtenida
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1, my: 1 }}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {score}
                </Typography>
                <Typography variant="h4" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  / {maxScore} pts
                </Typography>
              </Box>

              <Chip
                label={`${percentage}% de aciertos`}
                color={percentage >= 70 ? 'success' : percentage >= 60 ? 'warning' : 'error'}
                sx={{ fontWeight: 700, px: 1, mt: 1 }}
              />
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                bgcolor: isDark ? 'rgba(30, 43, 77, 0.3)' : '#f8fafc',
                borderRadius: '10px',
                borderColor: theme.palette.divider,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <LockClockIcon fontSize="medium" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Calificación en Espera
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
                La calificación final y los resultados detallados se publicarán una vez que el periodo de aplicación del examen haya finalizado
                {endDate ? ` (${dayjs(endDate).tz('America/Mexico_City').format('DD/MM/YYYY HH:mm')})` : ''}.
              </Typography>
              <Chip
                label="Entrega Registrada"
                color="info"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700, mt: 0.5 }}
              />
            </Paper>
          )}

          {/* Details breakdown */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Alumno:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{studentName}</Typography>
            </Box>
            {(grade || groupName) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Grado y Grupo:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{grade || '2do'} • Grupo {groupName || 'A'}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Examen:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{examTitle}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Fecha y hora de entrega (CDMX):</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatCdmx(result?.submittedAt)}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ py: 1.5, fontWeight: 700 }}
          >
            Volver a la Página Principal
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
