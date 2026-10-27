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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PERIOD_TYPES = [
  { value: 'TRIMESTRE', label: 'Trimestres (3 períodos)', count: 3 },
  { value: 'BLOQUE', label: 'Bloques (5 períodos)', count: 5 },
  { value: 'BIMESTRE', label: 'Bimestres (5 períodos)', count: 5 },
  { value: 'SEMESTRE', label: 'Semestres (2 períodos)', count: 2 },
  { value: 'CUATRIMESTRE', label: 'Cuatrimestres (3 períodos)', count: 3 },
  { value: 'ANUAL', label: 'Ciclo Anual (1 período)', count: 1 },
  { value: 'PERSONALIZADO', label: 'Personalizado', count: 4 },
];

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
  const [periodType, setPeriodType] = useState('TRIMESTRE');
  const [totalPeriods, setTotalPeriods] = useState(3);
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

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName('');
    setGrade('2do');
    setSubject('Tecnología');
    setShift('Matutino');
    setSchoolYear('2026-2027');
    setPeriodType('TRIMESTRE');
    setTotalPeriods(3);
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
    setPeriodType(group.periodType || 'TRIMESTRE');
    setTotalPeriods(group.totalPeriods || 3);
    setDescription(group.description || '');
    setModalError('');
    setModalOpen(true);
  };

  const handlePeriodTypeChange = (typeVal) => {
    setPeriodType(typeVal);
    const found = PERIOD_TYPES.find((p) => p.value === typeVal);
    if (found && typeVal !== 'PERSONALIZADO') {
      setTotalPeriods(found.count);
    }
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !grade.trim()) {
      setModalError('El nombre del grupo y grado son obligatorios.');
      return;
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
        periodType,
        totalPeriods: parseInt(totalPeriods, 10) || 3,
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
                      label={`${group.totalPeriods} ${group.periodTypeLabel || group.periodType}`}
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
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleSaveGroup}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingGroup ? 'Editar Grupo Escolar' : 'Crear Nuevo Grupo Escolar'}
          </DialogTitle>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Grado (ej: 1ro, 2do, 6to)"
                  fullWidth
                  size="small"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Grupo (ej: A, B, C)"
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
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

              <Grid item xs={8}>
                <FormControl fullWidth size="small">
                  <InputLabel>Esquema de Períodos</InputLabel>
                  <Select
                    value={periodType}
                    label="Esquema de Períodos"
                    onChange={(e) => handlePeriodTypeChange(e.target.value)}
                    disabled={!!editingGroup} // Can't change scheme once periods exist
                  >
                    {PERIOD_TYPES.map((pt) => (
                      <MenuItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  label="No. Períodos"
                  type="number"
                  fullWidth
                  size="small"
                  value={totalPeriods}
                  onChange={(e) => setTotalPeriods(e.target.value)}
                  inputProps={{ min: 1, max: 12 }}
                  disabled={!!editingGroup}
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
