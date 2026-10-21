import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import QuestionBuilderModal from '../components/QuestionBuilderModal';

export default function TeacherExamEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cloneFrom = searchParams.get('cloneFrom');
  const isEditing = !!id;
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('2do');
  const [groupName, setGroupName] = useState('A');
  const [block, setBlock] = useState(1);
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [endDate, setEndDate] = useState(dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm'));
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => {
    if (isEditing) {
      const fetchExam = async () => {
        try {
          const res = await api.get(`/teacher/exams/${id}`);
          const exam = res.data;
          setTitle(exam.title);
          setDescription(exam.description || '');
          setGrade(exam.grade || '2do');
          setGroupName(exam.groupName || 'A');
          setBlock(exam.block || 1);
          setCode(exam.code);
          setStartDate(dayjs(exam.startDate).format('YYYY-MM-DDTHH:mm'));
          setEndDate(dayjs(exam.endDate).format('YYYY-MM-DDTHH:mm'));
          setIsActive(exam.isActive);
          setQuestions(exam.questions || []);
        } catch (err) {
          setError('Error al cargar la información del examen.');
        } finally {
          setLoading(false);
        }
      };
      fetchExam();
    } else if (cloneFrom) {
      const fetchClone = async () => {
        try {
          const res = await api.get(`/teacher/exams/${cloneFrom}`);
          const exam = res.data;
          let nextGroup = 'B';
          if (exam.groupName) {
            const g = exam.groupName.trim().toUpperCase();
            if (g === 'A') nextGroup = 'B';
            else if (g === 'B') nextGroup = 'C';
            else if (g === 'C') nextGroup = 'D';
            else nextGroup = exam.groupName;
          }
          setTitle(`${exam.title} (Grupo ${nextGroup})`);
          setDescription(exam.description || '');
          setGrade(exam.grade || '2do');
          setGroupName(nextGroup);
          setBlock(exam.block || 1);
          setCode(''); // Clear so a new unique code is generated
          setStartDate(dayjs().format('YYYY-MM-DDTHH:mm'));
          setEndDate(dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm'));
          setIsActive(true);
          const clonedQuestions = (exam.questions || []).map((q, idx) => ({
            questionOrder: idx + 1,
            prompt: q.prompt,
            type: q.type,
            points: q.points,
            questionData: q.questionData,
            correctAnswer: q.correctAnswer,
          }));
          setQuestions(clonedQuestions);
        } catch (err) {
          setError('Error al cargar la información para clonar el examen.');
        } finally {
          setLoading(false);
        }
      };
      fetchClone();
    }
  }, [id, isEditing, cloneFrom]);

  const handleOpenAddModal = () => {
    setEditingQuestionIndex(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (index) => {
    setEditingQuestionIndex(index);
    setModalOpen(true);
  };

  const handleSaveQuestion = (questionData) => {
    if (editingQuestionIndex !== null) {
      // Edit existing
      const updated = [...questions];
      updated[editingQuestionIndex] = questionData;
      setQuestions(updated);
    } else {
      // Add new
      setQuestions([...questions, questionData]);
    }
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated);
  };

  const totalPoints = questions.reduce((acc, q) => acc + (parseFloat(q.points) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título del examen es obligatorio.');
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta al examen.');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      grade: grade.trim() || '2do',
      groupName: groupName.trim() || 'A',
      block: parseInt(block, 10) || 1,
      code: code.trim() || null,
      startDate: dayjs(startDate).format('YYYY-MM-DDTHH:mm:ss'),
      endDate: dayjs(endDate).format('YYYY-MM-DDTHH:mm:ss'),
      isActive,
      questions,
    };

    try {
      if (isEditing) {
        await api.put(`/teacher/exams/${id}`, payload);
      } else {
        await api.post('/teacher/exams', payload);
      }
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el examen');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/teacher/dashboard')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {isEditing ? 'Editar Examen' : cloneFrom ? 'Clonar Examen' : 'Nuevo Examen'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {cloneFrom
                ? 'Ajusta el título, grupo y fechas de aplicación. Todas las preguntas se han duplicado intactas.'
                : 'Configura los detalles generales, fechas de acceso y banco de preguntas'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={saving}
            onClick={handleSubmit}
            sx={{ fontWeight: 700 }}
          >
            {saving ? 'Guardando...' : 'Guardar Examen'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left: General Settings */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '12px', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Datos Generales
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Título del Examen"
                  placeholder="Ej: Examen Parcial de Historia Bloque 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                  <TextField
                    label="Bloque"
                    type="number"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    inputProps={{ min: 1, max: 10 }}
                    helperText="Ej: 1, 2, 3"
                    required
                  />
                  <TextField
                    label="Grado"
                    placeholder="Ej: 2do"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    helperText="Ej: 2do, 6to"
                    required
                  />
                  <TextField
                    label="Grupo"
                    placeholder="Ej: A"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    helperText="Ej: A, B"
                    required
                  />
                </Box>

                <TextField
                  label="Descripción o Instrucciones"
                  placeholder="Instrucciones para los alumnos..."
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Código de Acceso"
                  placeholder="Dejar en blanco para autogenerar"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  fullWidth
                  helperText="Código con el que ingresarán los alumnos"
                />

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Período de Aplicación (Fechas)
                </Typography>

                <TextField
                  label="Fecha y Hora de Inicio"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="A partir de este momento los alumnos podrán ingresar"
                />

                <TextField
                  label="Fecha y Hora de Fin"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Cierre de recepción de exámenes"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Examen Activo"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Question Builder & List */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Preguntas ({questions.length})
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Puntuación total acumulada:{' '}
                    <strong>{Math.round(totalPoints * 100) / 100} puntos</strong>
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddModal}
                  sx={{ fontWeight: 700 }}
                >
                  Agregar Pregunta
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {questions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                    No hay preguntas agregadas todavía
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Crea preguntas de opción múltiple, verdadero/falso, relacionar columnas o completar espacios.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                  >
                    Agregar Primera Pregunta
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {questions.map((q, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        '&:hover': {
                          borderColor: 'primary.light',
                          bgcolor: isDark ? 'rgba(75, 119, 216, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <Chip
                          label={`#${idx + 1}`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: isDark ? '#1E2945' : '#e2e8f0',
                            color: 'text.primary',
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={
                                q.type === 'MULTIPLE_CHOICE'
                                  ? 'Opción Múltiple'
                                  : q.type === 'CODE_BLOCK'
                                  ? 'Bloque de Código'
                                  : q.type === 'TRUE_FALSE'
                                  ? 'Verdadero / Falso'
                                  : q.type === 'RELATE_COLUMNS'
                                  ? 'Relacionar Columnas'
                                  : q.type === 'FILL_BLANKS'
                                  ? 'Completar Espacios'
                                  : 'Pregunta Abierta'
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                              {q.points} pts
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {q.prompt}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Reorder and Edit actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestion(idx, -1)}
                          >
                            <UpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={idx === questions.length - 1}
                            onClick={() => handleMoveQuestion(idx, 1)}
                          >
                            <DownIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditModal(idx)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteQuestion(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Question Builder Modal */}
      <QuestionBuilderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveQuestion}
        initialData={editingQuestionIndex !== null ? questions[editingQuestionIndex] : null}
      />
    </Container>
  );
}
