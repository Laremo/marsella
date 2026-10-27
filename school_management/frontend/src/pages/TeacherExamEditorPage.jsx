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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
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
  Balance as BalanceIcon,
  CheckCircle as CheckIcon,
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
  const [targetTotalPoints, setTargetTotalPoints] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Prompt dialog when a question's points are edited
  const [pointChangeDialog, setPointChangeDialog] = useState(null);
  const [snackMessage, setSnackMessage] = useState('');

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
          if (exam.totalPoints && exam.totalPoints > 0) {
            setTargetTotalPoints(exam.totalPoints);
          }
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
          if (exam.totalPoints && exam.totalPoints > 0) {
            setTargetTotalPoints(exam.totalPoints);
          }
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

  // Smart 2-decimal distribution algorithm that ensures exact total
  const calculateSmartDistribution = (total, count) => {
    if (count <= 0) return [];
    if (total <= 0) return new Array(count).fill(0);
    const base = Math.floor((total / count) * 100) / 100;
    const remainderCents = Math.round((total - base * count) * 100);
    const points = [];
    for (let i = 0; i < count; i++) {
      if (i < remainderCents) {
        points.push(Math.round((base + 0.01) * 100) / 100);
      } else {
        points.push(base);
      }
    }
    return points;
  };

  const calculateDefaultPointsForNew = () => {
    const nextCount = questions.length + 1;
    const dist = calculateSmartDistribution(targetTotalPoints, nextCount);
    return dist.length > 0 ? dist[dist.length - 1] : 1.0;
  };

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
      // EDITING EXISTING QUESTION
      const oldQ = questions[editingQuestionIndex];
      const oldPoints = parseFloat(oldQ.points) || 0;
      const newPoints = parseFloat(questionData.points) || 0;

      // Check if question point value was changed
      if (Math.abs(oldPoints - newPoints) > 0.001) {
        setPointChangeDialog({
          questionIndex: editingQuestionIndex,
          oldPoints,
          newPoints,
          questionData,
        });
        return;
      }

      // Points unchanged: simple update
      const updated = [...questions];
      updated[editingQuestionIndex] = questionData;
      setQuestions(updated);
      setModalOpen(false);
      setEditingQuestionIndex(null);
    } else {
      // ADDING NEW QUESTION: Auto-distribute targetTotalPoints across all questions
      const newCount = questions.length + 1;
      const distributed = calculateSmartDistribution(targetTotalPoints, newCount);
      const updatedExisting = questions.map((q, idx) => ({
        ...q,
        points: distributed[idx],
      }));
      const finalNew = {
        ...questionData,
        points: distributed[newCount - 1],
      };
      setQuestions([...updatedExisting, finalNew]);
      setModalOpen(false);
      setSnackMessage(`Pregunta agregada. Se ajustó el puntaje a ${targetTotalPoints} puntos en total.`);
    }
  };

  // User chose to automatically adjust remaining questions
  const handleApplyRedistributeOthers = () => {
    if (!pointChangeDialog) return;
    const { questionIndex, newPoints, questionData } = pointChangeDialog;
    const otherCount = questions.length - 1;

    let updated = [...questions];
    updated[questionIndex] = questionData;

    if (otherCount > 0) {
      const remainingTotal = Math.max(0, targetTotalPoints - newPoints);
      const dist = calculateSmartDistribution(remainingTotal, otherCount);
      let distIdx = 0;
      for (let i = 0; i < updated.length; i++) {
        if (i !== questionIndex) {
          updated[i] = {
            ...updated[i],
            points: dist[distIdx++],
          };
        }
      }
    }

    setQuestions(updated);
    setPointChangeDialog(null);
    setModalOpen(false);
    setEditingQuestionIndex(null);
    setSnackMessage('Se actualizó la pregunta y se ajustaron las demás automáticamente.');
  };

  // User chose to keep other questions as they were
  const handleKeepOthers = () => {
    if (!pointChangeDialog) return;
    const { questionIndex, questionData } = pointChangeDialog;
    const updated = [...questions];
    updated[questionIndex] = questionData;
    setQuestions(updated);

    const newSum = updated.reduce((acc, q) => acc + (parseFloat(q.points) || 0), 0);
    setTargetTotalPoints(Math.round(newSum * 100) / 100);

    setPointChangeDialog(null);
    setModalOpen(false);
    setEditingQuestionIndex(null);
    setSnackMessage('Se actualizó la pregunta conservando los valores de las demás.');
  };

  const handleDeleteQuestion = (index) => {
    const remaining = questions.filter((_, i) => i !== index);
    if (remaining.length > 0) {
      const distributed = calculateSmartDistribution(targetTotalPoints, remaining.length);
      const updated = remaining.map((q, idx) => ({
        ...q,
        points: distributed[idx],
      }));
      setQuestions(updated);
      setSnackMessage(`Pregunta eliminada. Se redistribuyó el total de ${targetTotalPoints} puntos.`);
    } else {
      setQuestions([]);
    }
  };

  const handleEvenlyDistributePoints = () => {
    if (questions.length === 0) return;
    const distributed = calculateSmartDistribution(targetTotalPoints, questions.length);
    const updated = questions.map((q, idx) => ({
      ...q,
      points: distributed[idx],
    }));
    setQuestions(updated);
    setSnackMessage(`Se repartieron los ${targetTotalPoints} puntos equitativamente entre las ${questions.length} preguntas.`);
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
  const roundedTotal = Math.round(totalPoints * 100) / 100;
  const isTargetMatched = Math.abs(roundedTotal - targetTotalPoints) <= 0.01;

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

                {/* Target Total Points configuration */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(75, 119, 216, 0.08)' : '#f8fafc',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(75, 119, 216, 0.25)' : '#e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Puntaje Total del Examen
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label="10 pts"
                        size="small"
                        clickable
                        color={targetTotalPoints === 10 ? 'primary' : 'default'}
                        onClick={() => {
                          setTargetTotalPoints(10);
                          if (questions.length > 0) {
                            const dist = calculateSmartDistribution(10, questions.length);
                            setQuestions(questions.map((q, idx) => ({ ...q, points: dist[idx] })));
                          }
                        }}
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                      />
                      <Chip
                        label="100 pts"
                        size="small"
                        clickable
                        color={targetTotalPoints === 100 ? 'primary' : 'default'}
                        onClick={() => {
                          setTargetTotalPoints(100);
                          if (questions.length > 0) {
                            const dist = calculateSmartDistribution(100, questions.length);
                            setQuestions(questions.map((q, idx) => ({ ...q, points: dist[idx] })));
                          }
                        }}
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                      />
                    </Box>
                  </Box>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={targetTotalPoints}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setTargetTotalPoints(val);
                    }}
                    inputProps={{ min: 1, step: 0.5 }}
                    helperText="El sistema distribuirá automáticamente este total conforme agregues o quites preguntas."
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Preguntas ({questions.length})
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Puntuación total:
                    </Typography>
                    <Chip
                      icon={isTargetMatched ? <CheckIcon sx={{ fontSize: '15px !important' }} /> : undefined}
                      label={`${roundedTotal} / ${targetTotalPoints} pts`}
                      size="small"
                      color={isTargetMatched ? 'success' : 'warning'}
                      variant={isTargetMatched ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 800, height: 22, fontSize: '0.75rem' }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {questions.length > 0 && (
                    <Tooltip title={`Repartir exactamente los ${targetTotalPoints} puntos equitativamente entre las ${questions.length} preguntas`}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<BalanceIcon />}
                        onClick={handleEvenlyDistributePoints}
                        sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        Repartir Puntos
                      </Button>
                    </Tooltip>
                  )}

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                    sx={{ fontWeight: 700 }}
                  >
                    Agregar Pregunta
                  </Button>
                </Box>
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
        onClose={() => {
          setModalOpen(false);
          setEditingQuestionIndex(null);
        }}
        onSave={handleSaveQuestion}
        initialData={editingQuestionIndex !== null ? questions[editingQuestionIndex] : null}
        defaultPoints={calculateDefaultPointsForNew()}
      />

      {/* Point Change Confirmation Prompt */}
      <Dialog
        open={!!pointChangeDialog}
        onClose={() => setPointChangeDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          ¿Deseas redistribuir el puntaje de las demás preguntas?
        </DialogTitle>
        <DialogContent dividers>
          {pointChangeDialog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                Cambiaste el valor de la <strong>Pregunta #{pointChangeDialog.questionIndex + 1}</strong> de{' '}
                <Chip label={`${pointChangeDialog.oldPoints} pts`} size="small" /> a{' '}
                <Chip label={`${pointChangeDialog.newPoints} pts`} size="small" color="primary" />.
              </Typography>

              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                {questions.length > 1 ? (
                  <>
                    El examen está configurado para un total de <strong>{targetTotalPoints} puntos</strong>.
                    <br />
                    Si ajustas automáticamente, quedarán{' '}
                    <strong>
                      {Math.max(0, targetTotalPoints - pointChangeDialog.newPoints).toFixed(2)} pts
                    </strong>{' '}
                    repartidos equitativamente entre las otras <strong>{questions.length - 1}</strong> preguntas (aprox.{' '}
                    <strong>
                      {Math.max(0, (targetTotalPoints - pointChangeDialog.newPoints) / (questions.length - 1)).toFixed(2)} pts
                    </strong>{' '}
                    cada una).
                  </>
                ) : (
                  <>Esta es la única pregunta del examen.</>
                )}
              </Alert>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Deseas que el sistema ajuste el puntaje del resto de las preguntas para mantener el total de {targetTotalPoints} puntos, o prefieres conservar los valores que ya tenían?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setPointChangeDialog(null)} color="inherit">
            Volver a editar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleKeepOthers}
              sx={{ fontWeight: 600 }}
            >
              Mantener valores actuales
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyRedistributeOthers}
              sx={{ fontWeight: 700 }}
            >
              Ajustar las demás preguntas
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar notification */}
      <Snackbar
        open={!!snackMessage}
        autoHideDuration={3000}
        onClose={() => setSnackMessage('')}
        message={snackMessage}
      />
    </Container>
  );
}
