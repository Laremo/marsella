import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Radio,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ContentCopy as DuplicateIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CorrectIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import quizApi from '../services/quizApi';
import api from '../services/api';

const QUIZ_OPTION_THEMES = [
  { id: 'A', name: 'Rojo', hex: '#E21B3C', shape: '▲', shapeName: 'TRIANGLE' },
  { id: 'B', name: 'Azul', hex: '#1368CE', shape: '◆', shapeName: 'DIAMOND' },
  { id: 'C', name: 'Amarillo', hex: '#D89E00', shape: '●', shapeName: 'CIRCLE' },
  { id: 'D', name: 'Verde', hex: '#26890C', shape: '■', shapeName: 'SQUARE' },
];

export default function TeacherQuizEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTimeLimitSeconds, setDefaultTimeLimitSeconds] = useState(15);
  const [basePoints, setBasePoints] = useState(1000);
  const [schoolGroupId, setSchoolGroupId] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      prompt: '',
      timeLimitSeconds: 15,
      points: 1000,
      explanation: '',
      options: [
        { id: 'A', text: '', color: 'RED', shape: 'TRIANGLE', isCorrect: true },
        { id: 'B', text: '', color: 'BLUE', shape: 'DIAMOND', isCorrect: false },
        { id: 'C', text: '', color: 'YELLOW', shape: 'CIRCLE', isCorrect: false },
        { id: 'D', text: '', color: 'GREEN', shape: 'SQUARE', isCorrect: false },
      ],
    },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const groupsRes = await api.get('/academic/groups').catch(() => ({ data: [] }));
      setGroups(groupsRes.data || []);

      if (isEditing) {
        const res = await quizApi.getTeacherQuiz(id);
        const data = res.data;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDefaultTimeLimitSeconds(data.defaultTimeLimitSeconds || 15);
        setBasePoints(data.basePoints || 1000);
        setSchoolGroupId(data.schoolGroupId || '');

        if (data.questions && data.questions.length > 0) {
          setQuestions(
            data.questions.map((q, idx) => ({
              ...q,
              tempId: idx + 1,
              options: ensureFourOptions(q.options),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error loading quiz editor data:', err);
      setSnack({ open: true, message: 'Error al cargar los datos del quizz.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const ensureFourOptions = (opts = []) => {
    const defaultTemplates = [
      { id: 'A', text: '', color: 'RED', shape: 'TRIANGLE', isCorrect: true },
      { id: 'B', text: '', color: 'BLUE', shape: 'DIAMOND', isCorrect: false },
      { id: 'C', text: '', color: 'YELLOW', shape: 'CIRCLE', isCorrect: false },
      { id: 'D', text: '', color: 'GREEN', shape: 'SQUARE', isCorrect: false },
    ];
    if (!opts || opts.length === 0) return defaultTemplates;
    return defaultTemplates.map((def, idx) => {
      const existing = opts[idx];
      return existing
        ? {
            id: def.id,
            text: existing.text || '',
            color: def.color,
            shape: def.shape,
            isCorrect: Boolean(existing.isCorrect),
          }
        : def;
    });
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        prompt: '',
        timeLimitSeconds: defaultTimeLimitSeconds,
        points: basePoints,
        explanation: '',
        options: [
          { id: 'A', text: '', color: 'RED', shape: 'TRIANGLE', isCorrect: true },
          { id: 'B', text: '', color: 'BLUE', shape: 'DIAMOND', isCorrect: false },
          { id: 'C', text: '', color: 'YELLOW', shape: 'CIRCLE', isCorrect: false },
          { id: 'D', text: '', color: 'GREEN', shape: 'SQUARE', isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      setSnack({ open: true, message: 'El quizz debe tener al menos una pregunta.', severity: 'warning' });
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateQuestion = (idx) => {
    const target = questions[idx];
    const cloned = JSON.parse(JSON.stringify(target));
    cloned.tempId = Date.now();
    delete cloned.id;
    const updated = [...questions];
    updated.splice(idx + 1, 0, cloned);
    setQuestions(updated);
  };

  const handleMoveQuestion = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleOptionTextChange = (qIdx, optIdx, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIdx].options];
      newOpts[optIdx] = { ...newOpts[optIdx], text };
      updated[qIdx] = { ...updated[qIdx], options: newOpts };
      return updated;
    });
  };

  const handleSetCorrectOption = (qIdx, optIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOpts = updated[qIdx].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIdx,
      }));
      updated[qIdx] = { ...updated[qIdx], options: newOpts };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setSnack({ open: true, message: 'Por favor asigna un título al quizz.', severity: 'warning' });
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setSnack({
          open: true,
          message: `La pregunta #${i + 1} no tiene texto.`,
          severity: 'warning',
        });
        return;
      }
      const hasAtLeastTwoFilled = q.options.filter((o) => o.text.trim().length > 0).length >= 2;
      if (!hasAtLeastTwoFilled) {
        setSnack({
          open: true,
          message: `La pregunta #${i + 1} debe tener al menos 2 opciones de respuesta con texto.`,
          severity: 'warning',
        });
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect && o.text.trim().length > 0);
      if (!hasCorrect) {
        setSnack({
          open: true,
          message: `La pregunta #${i + 1} debe tener marcada una opción correcta válida.`,
          severity: 'warning',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        defaultTimeLimitSeconds: parseInt(defaultTimeLimitSeconds, 10) || 15,
        basePoints: parseInt(basePoints, 10) || 1000,
        schoolGroupId: schoolGroupId ? parseInt(schoolGroupId, 10) : null,
        questions: questions.map((q, idx) => ({
          prompt: q.prompt.trim(),
          timeLimitSeconds: parseInt(q.timeLimitSeconds, 10) || 15,
          points: parseInt(q.points, 10) || 1000,
          explanation: (q.explanation || '').trim(),
          questionOrder: idx + 1,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text.trim(),
            color: o.color,
            shape: o.shape,
            isCorrect: Boolean(o.isCorrect),
          })),
        })),
      };

      if (isEditing) {
        await quizApi.updateTeacherQuiz(id, payload);
        setSnack({ open: true, message: 'Quizz actualizado exitosamente.', severity: 'success' });
      } else {
        await quizApi.createTeacherQuiz(payload);
        setSnack({ open: true, message: 'Quizz creado exitosamente.', severity: 'success' });
      }

      setTimeout(() => navigate('/teacher/quizzes'), 800);
    } catch (err) {
      console.error('Error saving quiz:', err);
      setSnack({
        open: true,
        message: err.response?.data?.message || 'Error al guardar el quizz.',
        severity: 'error',
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Bar Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/quizzes')}
          sx={{ borderRadius: '8px' }}
        >
          Volver a Quizzes
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: '10px',
            bgcolor: '#46178F',
            fontWeight: 700,
            px: 3,
            '&:hover': { bgcolor: '#34106d' },
          }}
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Quizz'}
        </Button>
      </Box>

      {/* Main Metadata Card */}
      <Card sx={{ borderRadius: '12px', mb: 4, p: 1, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            ⚙️ Configuración del Quizz
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Título del Quizz *"
                placeholder="Ej. Repaso de Matemáticas - Bloque 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="group-select-label">Grupo Escolar (Opcional)</InputLabel>
                <Select
                  labelId="group-select-label"
                  value={schoolGroupId}
                  label="Grupo Escolar (Opcional)"
                  onChange={(e) => setSchoolGroupId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Sin grupo (Partida Abierta)</em>
                  </MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name} ({g.grade} {g.groupLetter})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción o Instrucciones"
                placeholder="Breve resumen del objetivo de este quizz en vivo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Tiempo límite por defecto por pregunta (segundos)"
                inputProps={{ min: 5, max: 120, step: 'any' }}
                value={defaultTimeLimitSeconds}
                onChange={(e) => setDefaultTimeLimitSeconds(e.target.value)}
                helperText="Por defecto: 15 segundos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Puntos base por respuesta correcta"
                inputProps={{ min: 100, max: 5000, step: 'any' }}
                value={basePoints}
                onChange={(e) => setBasePoints(e.target.value)}
                helperText="Por defecto: 1000 puntos base (se pondera por velocidad)"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          📝 Preguntas ({questions.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
          sx={{ borderRadius: '8px', fontWeight: 700 }}
        >
          Agregar Pregunta
        </Button>
      </Box>

      {questions.map((q, qIdx) => (
        <Card
          key={q.tempId || q.id || qIdx}
          sx={{
            borderRadius: '12px',
            mb: 3,
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Question Top Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(70, 23, 143, 0.3)' : '#f3e8ff',
                    color: '#7e22ce',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {qIdx + 1}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Pregunta #{qIdx + 1}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Subir orden">
                  <span>
                    <IconButton
                      size="small"
                      disabled={qIdx === 0}
                      onClick={() => handleMoveQuestion(qIdx, -1)}
                    >
                      <MoveUpIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Bajar orden">
                  <span>
                    <IconButton
                      size="small"
                      disabled={qIdx === questions.length - 1}
                      onClick={() => handleMoveQuestion(qIdx, 1)}
                    >
                      <MoveDownIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Duplicar pregunta">
                  <IconButton size="small" onClick={() => handleDuplicateQuestion(qIdx)}>
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar pregunta">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={questions.length <= 1}
                      onClick={() => handleRemoveQuestion(qIdx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Prompt Input */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Texto de la Pregunta *"
              placeholder="Escribe la pregunta que verán los jugadores en pantalla..."
              value={q.prompt}
              onChange={(e) => handleQuestionChange(qIdx, 'prompt', e.target.value)}
              sx={{ mb: 2.5 }}
            />

            {/* Question timing & points */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Tiempo para responder (segundos)"
                  inputProps={{ min: 5, max: 120, step: 'any' }}
                  value={q.timeLimitSeconds}
                  onChange={(e) => handleQuestionChange(qIdx, 'timeLimitSeconds', e.target.value)}
                  InputProps={{
                    startAdornment: <TimerIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Puntos base de esta pregunta"
                  inputProps={{ min: 100, max: 5000, step: 'any' }}
                  value={q.points}
                  onChange={(e) => handleQuestionChange(qIdx, 'points', e.target.value)}
                  InputProps={{
                    startAdornment: <TrophyIcon sx={{ mr: 1, fontSize: 18, color: '#d97706' }} />,
                  }}
                />
              </Grid>
            </Grid>

            {/* 4 Options Grid */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Opciones de Respuesta (Marca con el círculo verde la respuesta correcta):
            </Typography>

            <Grid container spacing={2}>
              {q.options.map((opt, optIdx) => {
                const optionTheme = QUIZ_OPTION_THEMES[optIdx] || QUIZ_OPTION_THEMES[0];
                const isCorrect = opt.isCorrect;

                return (
                  <Grid item xs={12} sm={6} key={opt.id || optIdx}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: isCorrect ? '#16a34a' : isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                        bgcolor: isCorrect
                          ? isDark
                            ? 'rgba(22, 163, 74, 0.12)'
                            : '#f0fdf4'
                          : isDark
                          ? 'rgba(255,255,255,0.03)'
                          : '#fff',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {/* Geometric Badge */}
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '8px',
                          bgcolor: optionTheme.hex,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 900,
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }}
                      >
                        {optionTheme.shape}
                      </Box>

                      {/* Text Input */}
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={`Opción ${opt.id} (${optionTheme.name})...`}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                          },
                        }}
                      />

                      {/* Correct Check Button */}
                      <Tooltip title={isCorrect ? 'Respuesta Correcta' : 'Marcar como Correcta'}>
                        <IconButton
                          onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                          sx={{
                            color: isCorrect ? '#16a34a' : 'text.disabled',
                            p: 1,
                            '&:hover': {
                              color: '#16a34a',
                              bgcolor: 'rgba(22, 163, 74, 0.1)',
                            },
                          }}
                        >
                          {isCorrect ? <CorrectIcon /> : <UncheckedIcon />}
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Explanation / Notes */}
            <TextField
              fullWidth
              size="small"
              label="Explicación o dato curioso (opcional - se muestra al cerrar la pregunta)"
              placeholder="Ej. HTTPS es la versión cifrada del protocolo HTTP..."
              value={q.explanation || ''}
              onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
              sx={{ mt: 2.5 }}
            />
          </CardContent>
        </Card>
      ))}

      {/* Bottom Add Question Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 6 }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
          sx={{ borderRadius: '10px', py: 1.5, px: 4, fontWeight: 700 }}
        >
          Agregar Otra Pregunta
        </Button>
      </Box>

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

