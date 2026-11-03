import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  HelpOutline as QuestionIcon,
  Groups as GroupsIcon,
  Gamepad as GamepadIcon,
  Sensors as LiveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import quizApi from '../services/quizApi';
import api from '../services/api';

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [launchModalQuiz, setLaunchModalQuiz] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [launchMode, setLaunchMode] = useState('open'); // 'open' or 'group'
  const [launching, setLaunching] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, groupsRes] = await Promise.all([
        quizApi.getTeacherQuizzes(),
        api.get('/teacher/groups').catch(() => ({ data: [] })),
      ]);
      setQuizzes(quizzesRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setSnack({
        open: true,
        message: 'No se pudieron cargar los quizzes.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await quizApi.deleteTeacherQuiz(deleteId);
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteId));
      setSnack({ open: true, message: 'Quiz eliminado con éxito.', severity: 'success' });
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setSnack({ open: true, message: 'Error al eliminar el quiz.', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenLaunchModal = (quiz) => {
    setLaunchModalQuiz(quiz);
    if (quiz.schoolGroupId) {
      setLaunchMode('group');
      setSelectedGroupId(quiz.schoolGroupId);
    } else {
      setLaunchMode('open');
      setSelectedGroupId('');
    }
  };

  const handleConfirmLaunch = async () => {
    if (!launchModalQuiz) return;
    setLaunching(true);
    try {
      const targetGroupId = launchMode === 'group' && selectedGroupId ? selectedGroupId : null;
      const res = await quizApi.launchQuizSession(launchModalQuiz.id, targetGroupId);
      const session = res.data;
      navigate(`/teacher/quiz/live/${session.pin}`);
    } catch (err) {
      console.error('Error launching live quiz session:', err);
      setSnack({
        open: true,
        message: err.response?.data?.message || 'Error al iniciar la sala en vivo.',
        severity: 'error',
      });
      setLaunching(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
          p: 3,
          borderRadius: '12px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#c7d2fe'}`,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: '#46178F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 20,
              }}
            >
              🎮
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Quizzes en Vivo
            </Typography>
            <Chip
              icon={<LiveIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
              size="small"
              sx={{
                bgcolor: '#E21B3C',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.72rem',
                borderRadius: '6px',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Crea competencias en tiempo real con temporizador, podio de ganadores, rachas y reportes exportables.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/teacher/quizzes/new')}
          sx={{
            borderRadius: '10px',
            bgcolor: '#46178F',
            fontWeight: 700,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px 0 rgba(70, 23, 143, 0.35)',
            '&:hover': {
              bgcolor: '#34106d',
            },
          }}
        >
          Crear Quizz
        </Button>
      </Box>

      {/* Main Quizzes List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : quizzes.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '12px',
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <GamepadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No tienes quizzes creados aún
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Comienza creando un cuestionario interactivo con preguntas de opción múltiple, tiempo límite y colores dinámicos para jugar en clase.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/quizzes/new')}
            sx={{ borderRadius: '8px', bgcolor: '#46178F', fontWeight: 700 }}
          >
            Crear mi primer Quizz
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: isDark
                      ? '0 10px 24px -5px rgba(0,0,0,0.5)'
                      : '0 10px 24px -5px rgba(70, 23, 143, 0.15)',
                    borderColor: '#46178F',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        color: 'text.primary',
                      }}
                    >
                      {quiz.title}
                    </Typography>
                  </Box>

                  {quiz.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: 40,
                      }}
                    >
                      {quiz.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<QuestionIcon sx={{ fontSize: '15px !important' }} />}
                      label={`${quiz.questionCount || quiz.questions?.length || 0} Preguntas`}
                      size="small"
                      sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    <Chip
                      icon={<TimerIcon sx={{ fontSize: '15px !important' }} />}
                      label={`${quiz.defaultTimeLimitSeconds || 15}s por pregunta`}
                      size="small"
                      sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    <Chip
                      icon={<TrophyIcon sx={{ fontSize: '15px !important', color: '#d97706 !important' }} />}
                      label={`${quiz.basePoints || 1000} pts base`}
                      size="small"
                      sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    {quiz.schoolGroupName && (
                      <Chip
                        icon={<GroupsIcon sx={{ fontSize: '15px !important' }} />}
                        label={quiz.schoolGroupName}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </CardContent>

                <Divider />

                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleOpenLaunchModal(quiz)}
                    sx={{
                      borderRadius: '8px',
                      bgcolor: '#1368CE',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      px: 2,
                      '&:hover': { bgcolor: '#0b4da1' },
                    }}
                  >
                    Lanzar en Vivo
                  </Button>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Editar cuestionario">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                        sx={{ borderRadius: '8px' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar quizz">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(quiz.id)}
                        sx={{ borderRadius: '8px' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Launch Modal */}
      <Dialog
        open={Boolean(launchModalQuiz)}
        onClose={() => !launching && setLaunchModalQuiz(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          🎮 Lanzar Partida en Vivo
        </DialogTitle>
        <DialogContent dividers>
          {launchModalQuiz && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {launchModalQuiz.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {launchModalQuiz.questionCount || launchModalQuiz.questions?.length || 0} preguntas preparadas
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Modalidad de Participantes:
                </Typography>
                <RadioGroup
                  value={launchMode}
                  onChange={(e) => setLaunchMode(e.target.value)}
                >
                  <FormControlLabel
                    value="open"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Partida abierta por Código PIN (Cualquiera con el PIN)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Los alumnos entran con un apodo o nickname libre. Ideal para dinámicas rápidas.
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1.5 }}
                  />
                  <FormControlLabel
                    value="group"
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Vincular a Grupo Escolar (Monitoreo de asistencia)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Compara quiénes de la lista ya se han conectado en el lobby antes de iniciar.
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              {launchMode === 'group' && (
                <FormControl fullWidth size="small">
                  <InputLabel id="select-group-label">Seleccionar Grupo Escolar</InputLabel>
                  <Select
                    labelId="select-group-label"
                    value={selectedGroupId}
                    label="Seleccionar Grupo Escolar"
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name} - {g.grade} {g.groupLetter} ({g.studentCount || 0} alumnos)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setLaunchModalQuiz(null)}
            disabled={launching}
            sx={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmLaunch}
            disabled={launching || (launchMode === 'group' && !selectedGroupId)}
            startIcon={launching ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            sx={{
              borderRadius: '8px',
              bgcolor: '#1368CE',
              fontWeight: 700,
              '&:hover': { bgcolor: '#0b4da1' },
            }}
          >
            {launching ? 'Iniciando Sala...' : 'Crear Sala y Abrir Lobby'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => !deleting && setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar este quizz?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción eliminará permanentemente el cuestionario y sus preguntas asociadas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} disabled={deleting} sx={{ borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: '8px' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

