import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  AutoStories as SubjectIcon,
  Tune as WeightsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';


export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Modal create/edit group
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('2do');
  const [subject, setSubject] = useState('Tecnología');
  const [shift, setShift] = useState('Matutino');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [totalPeriods, setTotalPeriods] = useState(3);
  const [periodNames, setPeriodNames] = useState(['', '', '']);
  const [periodWeights, setPeriodWeights] = useState([33.33, 33.33, 33.34]);
  const [evaluationWeights, setEvaluationWeights] = useState([
    { name: 'Exámenes', percentage: 40, category: 'EXAMEN' },
    { name: 'Tareas y Trabajos', percentage: 40, category: 'ACTIVIDAD' },
    { name: 'Asistencia', percentage: 20, category: 'ASISTENCIA' },
  ]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/teacher/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups', err);
      setError('Error al cargar la lista de grupos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const calculateDefaultPeriodWeights = (num) => {
    const base = Math.floor((100 / num) * 100) / 100;
    const remainder = Math.round((100 - base * num) * 100) / 100;
    const weights = [];
    for (let i = 0; i < num; i++) {
      weights.push(i === num - 1 ? Math.round((base + remainder) * 100) / 100 : base);
    }
    return weights;
  };

  const handleTotalPeriodsChange = (val) => {
    const num = Math.max(1, Math.min(12, parseInt(val, 10) || 1));
    setTotalPeriods(num);
    setPeriodNames((prev) => {
      const updated = [...prev];
      while (updated.length < num) {
        updated.push('');
      }
      return updated.slice(0, num);
    });
    setPeriodWeights(calculateDefaultPeriodWeights(num));
  };

  const handlePeriodWeightChange = (index, value) => {
    const updated = [...periodWeights];
    updated[index] = parseFloat(value) || 0;
    setPeriodWeights(updated);
  };

  const handleAddEvaluationWeight = () => {
    setEvaluationWeights((prev) => [
      ...prev,
      { name: '', percentage: 10, category: 'ACTIVIDAD' },
    ]);
  };

  const handleRemoveEvaluationWeight = (index) => {
    setEvaluationWeights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEvaluationWeightChange = (index, field, value) => {
    setEvaluationWeights((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'percentage' ? parseFloat(value) || 0 : value,
      };
      return updated;
    });
  };

  const totalEvaluationWeight = evaluationWeights.reduce((sum, w) => sum + (parseFloat(w.percentage) || 0), 0);
  const totalPeriodWeight = periodWeights.reduce((sum, w) => sum + (parseFloat(w) || 0), 0);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName('');
    setGrade('2do');
    setSubject('Tecnología');
    setShift('Matutino');
    setSchoolYear('2026-2027');
    setTotalPeriods(3);
    setPeriodNames(['', '', '']);
    setPeriodWeights([33.33, 33.33, 33.34]);
    setEvaluationWeights([
      { name: 'Exámenes', percentage: 40, category: 'EXAMEN' },
      { name: 'Tareas y Trabajos', percentage: 40, category: 'ACTIVIDAD' },
      { name: 'Asistencia', percentage: 20, category: 'ASISTENCIA' },
    ]);
    setDescription('');
    setModalError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (group, e) => {
    e.stopPropagation();
    setEditingGroup(group);
    setName(group.name);
    setGrade(group.grade);
    setSubject(group.subject || '');
    setShift(group.shift || 'Matutino');
    setSchoolYear(group.schoolYear || '2026-2027');
    setTotalPeriods(group.totalPeriods || 3);
    setPeriodNames(group.periods ? group.periods.map((p) => p.name) : []);
    setPeriodWeights(group.periods ? group.periods.map((p) => p.periodWeight || 100) : [100]);
    if (group.evaluationWeights && group.evaluationWeights.length > 0) {
      setEvaluationWeights(group.evaluationWeights.map(w => ({
        id: w.id,
        name: w.name,
        percentage: w.percentage,
        category: w.category || 'ACTIVIDAD',
      })));
    } else {
      setEvaluationWeights([
        { name: 'Exámenes', percentage: 40, category: 'EXAMEN' },
        { name: 'Tareas y Trabajos', percentage: 40, category: 'ACTIVIDAD' },
        { name: 'Asistencia', percentage: 20, category: 'ASISTENCIA' },
      ]);
    }
    setDescription(group.description || '');
    setModalError('');
    setModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !grade.trim()) {
      setModalError('El nombre del grupo y grado son obligatorios.');
      return;
    }

    if (!editingGroup) {
      if (Math.round(totalEvaluationWeight) !== 100) {
        setModalError(`Las ponderaciones del grupo deben sumar 100%. Actualmente suman ${totalEvaluationWeight}%.`);
        return;
      }
      if (Math.round(totalPeriodWeight) !== 100) {
        setModalError(`El valor de los bloques en la calificación total debe sumar 100%. Actualmente suman ${totalPeriodWeight}%.`);
        return;
      }
      for (const w of evaluationWeights) {
        if (!w.name.trim()) {
          setModalError('Todas las ponderaciones deben tener un nombre.');
          return;
        }
      }
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        name: name.trim(),
        grade: grade.trim(),
        subject: subject.trim(),
        shift,
        schoolYear,
        totalPeriods: parseInt(totalPeriods, 10) || 3,
        periodNames: periodNames.map((pn, i) => pn.trim() || `Período ${i + 1}`),
        periodWeights: periodWeights,
        evaluationWeights: evaluationWeights.map(w => ({
          name: w.name.trim(),
          percentage: parseFloat(w.percentage) || 0,
          category: w.category || 'ACTIVIDAD',
        })),
        description: description.trim(),
      };

      if (editingGroup) {
        await api.put(`/teacher/groups/${editingGroup.id}`, payload);
      } else {
        await api.post('/teacher/groups', payload);
      }
      setModalOpen(false);
      fetchGroups();
    } catch (err) {
      console.error('Error saving group', err);
      setModalError(err.response?.data?.error || 'Error al guardar el grupo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/teacher/groups/${deleteId}`);
      setDeleteId(null);
      fetchGroups();
    } catch (err) {
      console.error('Error deleting group', err);
    } finally {
      setDeleting(false);
    }
  };

  const totalStudents = groups.reduce((acc, g) => acc + (g.studentCount || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Gestión Escolar: Grupos y Alumnos
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Administra tus clases, listas de asistencia, ponderaciones, actividades y reportes de conducta.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontWeight: 700, borderRadius: '8px' }}
        >
          Crear Nuevo Grupo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #2563EB' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon sx={{ fontSize: 38, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{groups.length}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Grupos Escolares</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #10B981' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 38, color: 'success.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalStudents}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Alumnos Inscritos</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #F59E0B' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon sx={{ fontSize: 38, color: 'warning.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>2026-2027</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Ciclo Escolar Activo</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Groups Grid */}
      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Card sx={{ borderRadius: '12px', p: 6, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No tienes grupos escolares registrados
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Crea tu primer grupo (ej: 2do "A") y podrás importar alumnos directamente desde tus exámenes ya aplicados.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Crear Primer Grupo
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card
                sx={{
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(`/teacher/groups/${group.id}`)}
              >
                <CardContent sx={{ flex: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Chip
                        label={`${group.grade} "${group.name}"`}
                        color="primary"
                        sx={{ fontWeight: 800, fontSize: '0.85rem', mb: 1 }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {group.subject || 'Materia General'}
                      </Typography>
                    </Box>

                    <Chip
                      label={group.shift}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, minHeight: 40 }}>
                    {group.description || `Ciclo ${group.schoolYear} • Turno ${group.shift}`}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {group.studentCount} alumnos
                      </Typography>
                    </Box>

                    <Chip
                      label={`${group.totalPeriods} ${group.totalPeriods === 1 ? 'Período' : 'Períodos'}`}
                      size="small"
                      sx={{ bgcolor: isDark ? '#1E2945' : '#e0e7ff', color: 'primary.main', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Box>
                    <Tooltip title="Editar grupo">
                      <IconButton size="small" onClick={(e) => handleOpenEdit(group, e)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar grupo">
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(group.id); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/groups/${group.id}`);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    Gestionar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit Group Modal */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleSaveGroup}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingGroup ? 'Editar Grupo Escolar' : 'Crear Nuevo Grupo Escolar'}
          </DialogTitle>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
              1. Datos Generales del Grupo
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Grado (ej: 1ro, 2do)"
                  fullWidth
                  size="small"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Grupo (ej: A, B, C)"
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Asignatura o Materia"
                  placeholder="Ej: Tecnología, Informática, Matemáticas"
                  fullWidth
                  size="small"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Turno</InputLabel>
                  <Select value={shift} label="Turno" onChange={(e) => setShift(e.target.value)}>
                    <MenuItem value="Matutino">Matutino</MenuItem>
                    <MenuItem value="Vespertino">Vespertino</MenuItem>
                    <MenuItem value="Completo">Tiempo Completo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Ciclo Escolar"
                  fullWidth
                  size="small"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Descripción o Notas"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales sobre el grupo..."
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Ponderaciones del Grupo */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    2. Ponderaciones del Grupo (Se aplican igual a cada bloque/período)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Elige qué ponderaciones existen, cuánto vale cada una y su nombre. Deben sumar 100%.
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddEvaluationWeight}
                  sx={{ fontWeight: 700 }}
                >
                  Agregar Ponderación
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1.5 }}>
                {evaluationWeights.map((ew, idx) => (
                  <Grid container spacing={1.5} alignItems="center" key={idx}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        size="small"
                        fullWidth
                        label={`Nombre Ponderación #${idx + 1}`}
                        placeholder="Ej: Exámenes, Tareas, Libreta, Asistencia"
                        value={ew.name}
                        onChange={(e) => handleEvaluationWeightChange(idx, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={ew.category || 'ACTIVIDAD'}
                          label="Categoría"
                          onChange={(e) => handleEvaluationWeightChange(idx, 'category', e.target.value)}
                        >
                          <MenuItem value="EXAMEN">Exámenes en línea</MenuItem>
                          <MenuItem value="ACTIVIDAD">Tareas y Actividades</MenuItem>
                          <MenuItem value="ASISTENCIA">Pase de Asistencia</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4} sm={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Porcentaje (%)"
                        type="number"
                        inputProps={{ min: 1, max: 100 }}
                        value={ew.percentage}
                        onChange={(e) => handleEvaluationWeightChange(idx, 'percentage', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={2} sm={1} sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={evaluationWeights.length <= 1}
                        onClick={() => handleRemoveEvaluationWeight(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Box>

              <Alert
                severity={Math.round(totalEvaluationWeight) === 100 ? 'success' : 'warning'}
                sx={{ py: 0.5, alignItems: 'center' }}
              >
                Suma de ponderaciones del grupo: <strong>{totalEvaluationWeight}%</strong> {Math.round(totalEvaluationWeight) === 100 ? '✓ (Correcto)' : '(Debe sumar exactamente 100%)'}
              </Alert>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Períodos y Valor de cada Bloque */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                3. Bloques o Períodos y su Valor en la Calificación Total
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Los bloques pueden valer más o menos de la calificación final del curso (ej. 30%, 30%, 40%). Deben sumar 100%.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cantidad de Bloques / Períodos"
                    type="number"
                    fullWidth
                    size="small"
                    value={totalPeriods}
                    onChange={(e) => handleTotalPeriodsChange(e.target.value)}
                    inputProps={{ min: 1, max: 12 }}
                    disabled={!!editingGroup}
                    helperText={editingGroup ? 'La cantidad de períodos no se puede cambiar una vez creado el grupo' : 'Indica cuántos períodos tendrá el curso (ej. 1, 2, 3, 4...)'}
                  />
                </Grid>
              </Grid>

              {!editingGroup && (
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {Array.from({ length: totalPeriods }).map((_, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                        <TextField
                          size="small"
                          fullWidth
                          label={`Nombre Bloque ${idx + 1}`}
                          placeholder={`Período ${idx + 1}`}
                          value={periodNames[idx] || ''}
                          onChange={(e) => {
                            const updated = [...periodNames];
                            updated[idx] = e.target.value;
                            setPeriodNames(updated);
                          }}
                          sx={{ mb: 1.5 }}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          label={`Valor en Calificación Final (%)`}
                          type="number"
                          inputProps={{ min: 0, max: 100, step: 0.5 }}
                          value={periodWeights[idx] !== undefined ? periodWeights[idx] : ''}
                          onChange={(e) => handlePeriodWeightChange(idx, e.target.value)}
                          helperText={`¿Cuánto vale este bloque para la calificación anual/final?`}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              {!editingGroup && (
                <Alert
                  severity={Math.round(totalPeriodWeight) === 100 ? 'success' : 'warning'}
                  sx={{ py: 0.5, alignItems: 'center' }}
                >
                  Suma del valor de los bloques: <strong>{totalPeriodWeight}%</strong> {Math.round(totalPeriodWeight) === 100 ? '✓ (Correcto)' : '(Debe sumar exactamente 100%)'}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Eliminar este grupo escolar?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción eliminará el grupo, los alumnos registrados en él, sus listas de asistencia, actividades e incidencias.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Eliminar Grupo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
