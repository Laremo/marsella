import React, { useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Key as KeyIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  History as ResumeIcon,
  Person as PersonIcon,
  CheckCircle as ValidIcon,
  MenuBook as BookIcon,
  Class as ClassIcon,
  Groups as GroupsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useColorTheme } from '../context/ThemeContext';

export default function StudentJoinPage() {
  const [step, setStep] = useState(1); // 1 = Código de examen, 2 = Nombre del alumno
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [verifiedExam, setVerifiedExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const theme = useTheme();
  const { isDark, toggleTheme } = useColorTheme();

  // Paso 1: Validar únicamente el código del examen
  const handleVerifyCode = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Por favor ingresa el código del examen para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/student/exams/check/${trimmedCode}`);
      const examData = res.data;
      setVerifiedExam(examData);
      setStep(2); // Pasar solo y solo si el código es válido
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('No se pudo verificar el código. Verifica la conexión a la red escolar.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Registrar o reanudar el examen con el nombre del alumno
  const handleJoinExam = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedName = studentName.trim();
    if (!trimmedName) {
      setError('Por favor ingresa tu nombre completo para comenzar.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/student/exams/join', {
        code: verifiedExam.code,
        studentName: trimmedName,
      });

      const session = res.data;
      sessionStorage.setItem('studentSession', JSON.stringify(session));

      if (session.status === 'ALREADY_SUBMITTED') {
        navigate(`/exam/finished/${session.submissionId}`, { state: { session } });
      } else {
        navigate(`/exam/${session.submissionId}`, { state: { session } });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ocurrió un error al ingresar al examen. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCode = () => {
    setStep(1);
    setError('');
  };

  const handleUseDemo = () => {
    setCode('DEMO-2026');
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6 } }}>
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

      {/* Header: EVALUACIONES / Laremo with Cheese Icon */}
      <Box sx={{ textAlign: 'center', mb: 3.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 68,
            height: 68,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
            mb: 1.8,
            fontSize: '36px',
            lineHeight: 1,
            userSelect: 'none',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.45)'
              : '0 8px 20px rgba(245, 158, 11, 0.25)',
          }}
        >
          🧀
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: 'text.primary',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          EVALUACIONES
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: 'secondary.main',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
            mb: 1,
            fontSize: '1.05rem',
          }}
        >
          Laremo
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto' }}>
          {step === 1
            ? 'Ingresa el código proporcionado por tu profesor para acceder a la evaluación.'
            : 'Confirma los datos del examen e introduce tu nombre completo para comenzar.'}
        </Typography>
      </Box>

      <Card
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: '12px',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {error}
              </Alert>
            </Fade>
          )}

          {/* ========================================================================= */}
          {/* PASO 1: PANTALLA INICIAL (SOLO CÓDIGO DE EXAMEN) */}
          {/* ========================================================================= */}
          {step === 1 && (
            <Box component="form" onSubmit={handleVerifyCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <KeyIcon color="secondary" sx={{ fontSize: 20 }} />
                  Código del Examen
                </Typography>
                <TextField
                  placeholder="EX4B2XRTTD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  fullWidth
                  autoFocus
                  disabled={loading}
                  inputProps={{
                    style: {
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      color: isDark ? '#F8FAFC' : '#141B34',
                    },
                  }}
                  helperText="Ingresa el código del examen para comenzar"
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !code.trim()}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowIcon />}
                sx={{
                  py: 1.6,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Verificando Código...' : 'Continuar'}
              </Button>

              <Divider sx={{ my: 1 }} />

              {/* Reconnection assurance card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: isDark ? 'rgba(30, 43, 77, 0.4)' : '#F8FAFD',
                  borderRadius: '10px',
                  borderColor: isDark ? '#223052' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                <ResumeIcon color="secondary" sx={{ mt: 0.3 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Nota:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
                    En caso de desconexión, vuelve a ingresar con el código del examen y tu nombre completo para retomar donde te quedaste.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: EXAMEN VALIDADO -> MOSTRAR BLOQUE, GRADO, GRUPO Y PEDIR NOMBRE   */}
          {/* ========================================================================= */}
          {step === 2 && verifiedExam && (
            <Fade in={step === 2}>
              <Box component="form" onSubmit={handleJoinExam} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Verified Exam Details Card */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(163, 25, 52, 0.08)' : 'rgba(27, 37, 75, 0.04)',
                    borderColor: isDark ? 'rgba(225, 29, 72, 0.3)' : 'rgba(27, 37, 75, 0.15)',
                    position: 'relative',
                  }}
                >
                  {/* Badges: Grado y Grupo */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Chip
                      icon={<ValidIcon sx={{ fontSize: '16px !important', color: '#16a34a !important' }} />}
                      label={`Código: ${verifiedExam.code}`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: isDark ? '#14251B' : '#EAF8EE',
                        color: isDark ? '#4ade80' : '#15803d',
                        borderColor: isDark ? '#1D3B2B' : '#B8E6C4',
                      }}
                      variant="outlined"
                    />

                    {/* Grado */}
                    <Chip
                      icon={<BookIcon sx={{ fontSize: '15px !important' }} />}
                      label={`Grado: ${verifiedExam.grade || '2do'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />

                    {/* Grupo */}
                    <Chip
                      icon={<GroupsIcon sx={{ fontSize: '15px !important' }} />}
                      label={`Grupo: ${verifiedExam.groupName || 'A'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  {/* Bloque: FORMATO REQUERIDO: "Examen del bloque N" */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: 'secondary.main',
                      letterSpacing: '-0.02em',
                      mb: 0.5,
                    }}
                  >
                    Examen del bloque {verifiedExam.block || 1}
                  </Typography>

                  {/* Título de la materia */}
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    {verifiedExam.title}
                  </Typography>

                  {verifiedExam.description && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      {verifiedExam.description}
                    </Typography>
                  )}

                  {/* Puntos y preguntas */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Puntaje total: <strong>{verifiedExam.totalPoints} pts</strong>
                    </Typography>
                    {verifiedExam.questionCount > 0 && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Preguntas: <strong>{verifiedExam.questionCount} reactivos</strong>
                      </Typography>
                    )}
                  </Box>
                </Paper>

                {/* Input de Nombre Completo */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <PersonIcon color="primary" sx={{ fontSize: 20 }} />
                    Nombre Completo del Alumno
                  </Typography>
                  <TextField
                    placeholder="Ej: Sofía Morales Hernández"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    fullWidth
                    autoFocus
                    disabled={loading}
                    helperText="Ingresa tu nombre y apellidos tal como aparecen en la lista escolar"
                  />
                </Box>

                {/* Botón Comenzar / Reanudar */}
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  disabled={loading || !studentName.trim()}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowIcon />}
                  sx={{
                    py: 1.6,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  {loading ? 'Accediendo al Examen...' : 'Comenzar / Reanudar Examen'}
                </Button>

                {/* Opción para cambiar de código */}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    startIcon={<BackIcon />}
                    size="small"
                    color="inherit"
                    onClick={handleBackToCode}
                    disabled={loading}
                    sx={{ textTransform: 'none', color: 'text.secondary' }}
                  >
                    Ingresar un código de examen diferente
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Floating Teacher Access Button in Bottom Right */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 28 },
          right: { xs: 20, sm: 28 },
          zIndex: 100,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          size="medium"
          startIcon={<PersonIcon />}
          onClick={() => navigate('/teacher/login')}
          sx={{
            bgcolor: isDark ? 'rgba(19, 27, 49, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            fontWeight: 700,
            borderRadius: '10px',
            borderColor: theme.palette.divider,
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(27, 37, 75, 0.1)',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: isDark ? 'rgba(30, 43, 77, 0.95)' : 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          Acceso Docentes
        </Button>
      </Box>
    </Container>
  );
}
