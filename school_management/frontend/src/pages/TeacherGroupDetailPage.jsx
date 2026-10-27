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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  People as PeopleIcon,
  Add as AddIcon,
  UploadFile as ImportIcon,
  CalendarToday as AttendanceIcon,
  Assignment as ActivityIcon,
  Warning as IncidentIcon,
  Calculate as GradebookIcon,
  Tune as WeightsIcon,
  Delete as DeleteIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  VerifiedUser as JustifiedIcon,
  Star as StarIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';

export default function TeacherGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [group, setGroup] = useState(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');

  // Tab 0: Students State
  const [students, setStudents] = useState([]);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentIdCode, setNewStudentIdCode] = useState('');
  const [bulkExamModalOpen, setBulkExamModalOpen] = useState(false);
  const [teacherExams, setTeacherExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [bulkTextModalOpen, setBulkTextModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [importing, setImporting] = useState(false);

  // Tab 1: Periods & Weights State
  const [weightsModalOpen, setWeightsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [editingPeriodName, setEditingPeriodName] = useState('');
  const [examWeight, setExamWeight] = useState(40);
  const [activityWeight, setActivityWeight] = useState(40);
  const [attendanceWeight, setAttendanceWeight] = useState(20);
  const [conductWeight, setConductWeight] = useState(0);

  // Tab 2: Attendance State
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [attendanceItems, setAttendanceItems] = useState([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState([]);

  // Tab 3: Activities State
  const [activities, setActivities] = useState([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState('TAREA');
  const [actMaxPoints, setActMaxPoints] = useState(10);
  const [actDueDate, setActDueDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DD'));
  const [actIsExtra, setActIsExtra] = useState(false);
  const [gradingActivity, setGradingActivity] = useState(null);
  const [studentScores, setStudentScores] = useState([]);

  // Tab 4: Incidents State
  const [incidents, setIncidents] = useState([]);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incStudentId, setIncStudentId] = useState('');
  const [incType, setIncType] = useState('LLAMADO_ATENCION');
  const [incSeverity, setIncSeverity] = useState('LEVE');
  const [incTitle, setIncTitle] = useState('');
  const [incDescription, setIncDescription] = useState('');
  const [incDeduction, setIncDeduction] = useState(0);

  // Tab 5: Gradebook State
  const [gradebook, setGradebook] = useState(null);
  const [gradebookLoading, setGradebookLoading] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const res = await api.get(`/teacher/groups/${id}`);
      setGroup(res.data);
      if (res.data.periods && res.data.periods.length > 0) {
        const active = res.data.periods.find((p) => p.isCurrent) || res.data.periods[0];
        if (!selectedPeriodId) {
          setSelectedPeriodId(active.id);
        }
      }
    } catch (err) {
      console.error('Error fetching group', err);
      setError('Error al cargar la información del grupo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/teacher/groups/${id}/students`);
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students', err);
    }
  };

  const fetchTeacherExams = async () => {
    try {
      const res = await api.get('/teacher/exams');
      setTeacherExams(res.data);
    } catch (err) {
      console.error('Error fetching exams', err);
    }
  };

  const fetchDailyAttendance = async (date) => {
    try {
      const res = await api.get(`/teacher/groups/${id}/attendance?date=${date}`);
      setAttendanceItems(res.data.records || []);
    } catch (err) {
      console.error('Error fetching attendance', err);
    }
  };

  const fetchAttendanceSummary = async (periodId) => {
    if (!periodId) return;
    try {
      const res = await api.get(`/teacher/groups/${id}/attendance/summary?periodId=${periodId}`);
      setAttendanceSummary(res.data);
    } catch (err) {
      console.error('Error fetching attendance summary', err);
    }
  };

  const fetchActivities = async (periodId) => {
    if (!periodId) return;
    try {
      const res = await api.get(`/teacher/groups/${id}/activities?periodId=${periodId}`);
      setActivities(res.data);
    } catch (err) {
      console.error('Error fetching activities', err);
    }
  };

  const fetchIncidents = async (periodId) => {
    try {
      const query = periodId ? `?periodId=${periodId}` : '';
      const res = await api.get(`/teacher/groups/${id}/incidents${query}`);
      setIncidents(res.data);
    } catch (err) {
      console.error('Error fetching incidents', err);
    }
  };

  const fetchGradebook = async (periodId) => {
    if (!periodId) return;
    setGradebookLoading(true);
    try {
      const res = await api.get(`/teacher/groups/${id}/gradebook?periodId=${periodId}`);
      setGradebook(res.data);
    } catch (err) {
      console.error('Error fetching gradebook', err);
    } finally {
      setGradebookLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchStudents();
    fetchTeacherExams();
  }, [id]);

  useEffect(() => {
    if (selectedPeriodId) {
      if (currentTab === 2) {
        fetchDailyAttendance(attendanceDate);
        fetchAttendanceSummary(selectedPeriodId);
      } else if (currentTab === 3) {
        fetchActivities(selectedPeriodId);
      } else if (currentTab === 4) {
        fetchIncidents(selectedPeriodId);
      } else if (currentTab === 5) {
        fetchGradebook(selectedPeriodId);
      }
    }
  }, [selectedPeriodId, currentTab]);

  // Tab 0 Handlers (Students)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    try {
      await api.post(`/teacher/groups/${id}/students`, {
        fullName: newStudentName.trim(),
        studentIdentifier: newStudentIdCode.trim() || null,
      });
      setStudentModalOpen(false);
      setNewStudentName('');
      setNewStudentIdCode('');
      setSnack('Alumno agregado al grupo.');
      fetchStudents();
      fetchGroupDetails();
    } catch (err) {
      setSnack(err.response?.data?.error || 'Error al agregar alumno.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await api.delete(`/teacher/groups/${id}/students/${studentId}`);
      setSnack('Alumno eliminado del grupo.');
      fetchStudents();
      fetchGroupDetails();
    } catch (err) {
      setSnack('Error al eliminar alumno.');
    }
  };

  const handleBulkImportExam = async () => {
    if (!selectedExamId) return;
    setImporting(true);
    try {
      const res = await api.post(`/teacher/groups/${id}/students/bulk-import`, {
        sourceExamId: selectedExamId,
      });
      setBulkExamModalOpen(false);
      setSelectedExamId('');
      setSnack(`¡Éxito! Se importaron ${res.data.importedCount} alumnos desde el examen.`);
      fetchStudents();
      fetchGroupDetails();
    } catch (err) {
      setSnack(err.response?.data?.error || 'Error al importar alumnos desde el examen.');
    } finally {
      setImporting(false);
    }
  };

  const handleBulkImportText = async () => {
    if (!bulkRawText.trim()) return;
    setImporting(true);
    try {
      const res = await api.post(`/teacher/groups/${id}/students/bulk-import`, {
        rawNamesText: bulkRawText,
      });
      setBulkTextModalOpen(false);
      setBulkRawText('');
      setSnack(`¡Éxito! Se importaron ${res.data.importedCount} alumnos.`);
      fetchStudents();
      fetchGroupDetails();
    } catch (err) {
      setSnack(err.response?.data?.error || 'Error al importar alumnos.');
    } finally {
      setImporting(false);
    }
  };

  // Tab 1 Handlers (Periods & Weights)
  const handleOpenWeights = (period) => {
    setEditingPeriod(period);
    setEditingPeriodName(period.name || '');
    setExamWeight(period.examWeight || 40);
    setActivityWeight(period.activityWeight || 40);
    setAttendanceWeight(period.attendanceWeight || 20);
    setConductWeight(period.conductWeight || 0);
    setWeightsModalOpen(true);
  };

  const handleSaveWeights = async () => {
    if (!editingPeriod) return;
    try {
      await api.put(`/teacher/groups/${id}/periods/${editingPeriod.id}/weights`, {
        name: editingPeriodName.trim() || editingPeriod.name,
        examWeight,
        activityWeight,
        attendanceWeight,
        conductWeight,
        targetScale: 10.0,
      });
      setWeightsModalOpen(false);
      setSnack('Período y ponderaciones guardados con éxito.');
      fetchGroupDetails();
    } catch (err) {
      setSnack('Error al guardar ponderaciones.');
    }
  };

  const handleSetActivePeriod = async (periodId) => {
    try {
      await api.put(`/teacher/groups/${id}/periods/${periodId}/weights`, {
        isCurrent: true,
        examWeight: 40,
        activityWeight: 40,
        attendanceWeight: 20,
      });
      setSelectedPeriodId(periodId);
      setSnack('Período marcado como activo.');
      fetchGroupDetails();
    } catch (err) {
      setSnack('Error al cambiar período activo.');
    }
  };

  // Tab 2 Handlers (Attendance)
  const handleAttendanceStatusChange = (studentId, status) => {
    setAttendanceItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceItems((prev) =>
      prev.map((item) => ({ ...item, status: 'PRESENT' }))
    );
  };

  const handleSaveDailyAttendance = async () => {
    setAttendanceSaving(true);
    try {
      await api.post(`/teacher/groups/${id}/attendance`, {
        date: attendanceDate,
        academicPeriodId: selectedPeriodId,
        items: attendanceItems,
      });
      setSnack('¡Lista de asistencia guardada!');
      fetchAttendanceSummary(selectedPeriodId);
    } catch (err) {
      setSnack('Error al guardar asistencia.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Tab 3 Handlers (Activities)
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!actTitle.trim()) return;
    try {
      await api.post(`/teacher/groups/${id}/activities`, {
        academicPeriodId: selectedPeriodId,
        title: actTitle.trim(),
        type: actType,
        maxPoints: parseFloat(actMaxPoints) || 10,
        dueDate: actDueDate,
        isExtraPoints: actIsExtra,
      });
      setActivityModalOpen(false);
      setActTitle('');
      setSnack('Actividad creada con éxito.');
      fetchActivities(selectedPeriodId);
    } catch (err) {
      setSnack('Error al crear actividad.');
    }
  };

  const handleOpenGrading = async (activity) => {
    setGradingActivity(activity);
    try {
      const res = await api.get(`/teacher/groups/${id}/activities/${activity.id}/scores`);
      setStudentScores(res.data);
    } catch (err) {
      console.error('Error fetching activity scores', err);
    }
  };

  const handleSaveScores = async () => {
    if (!gradingActivity) return;
    try {
      await api.put(`/teacher/groups/${id}/activities/${gradingActivity.id}/scores`, {
        scores: studentScores,
      });
      setGradingActivity(null);
      setSnack('Calificaciones de la actividad guardadas con éxito.');
      fetchActivities(selectedPeriodId);
    } catch (err) {
      setSnack('Error al guardar calificaciones.');
    }
  };

  // Tab 4 Handlers (Incidents)
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!incStudentId || !incTitle.trim()) return;
    try {
      await api.post(`/teacher/groups/${id}/incidents`, {
        studentId: incStudentId,
        academicPeriodId: selectedPeriodId,
        date: dayjs().format('YYYY-MM-DD'),
        type: incType,
        severity: incSeverity,
        title: incTitle.trim(),
        description: incDescription.trim(),
        pointDeduction: parseFloat(incDeduction) || 0,
      });
      setIncidentModalOpen(false);
      setIncTitle('');
      setIncDescription('');
      setIncDeduction(0);
      setSnack('Incidencia / reporte registrado.');
      fetchIncidents(selectedPeriodId);
    } catch (err) {
      setSnack('Error al registrar incidencia.');
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    try {
      await api.delete(`/teacher/groups/${id}/incidents/${incidentId}`);
      setSnack('Incidencia eliminada.');
      fetchIncidents(selectedPeriodId);
    } catch (err) {
      setSnack('Error al eliminar incidencia.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedPeriod = group?.periods?.find((p) => p.id === selectedPeriodId) || group?.periods?.[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Breadcrumb & Group Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/teacher/groups')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {group?.grade} "{group?.name}"
              </Typography>
              <Chip label={group?.subject} color="primary" size="small" sx={{ fontWeight: 700 }} />
              <Chip label={`Turno ${group?.shift}`} size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Ciclo {group?.schoolYear} • {students.length} alumnos registrados
            </Typography>
          </Box>
        </Box>

        {/* Period Selector Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Período:</Typography>
          <Select
            size="small"
            value={selectedPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            sx={{ minWidth: 160, fontWeight: 700 }}
          >
            {group?.periods?.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} {p.isCurrent ? '★ (Actual)' : ''}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Main Feature Tabs */}
      <Paper sx={{ borderRadius: '12px', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PeopleIcon />} iconPosition="start" label={`Alumnos (${students.length})`} />
          <Tab icon={<WeightsIcon />} iconPosition="start" label="Ponderaciones y Períodos" />
          <Tab icon={<AttendanceIcon />} iconPosition="start" label="Pase de Asistencia" />
          <Tab icon={<ActivityIcon />} iconPosition="start" label={`Actividades (${activities.length})`} />
          <Tab icon={<IncidentIcon />} iconPosition="start" label={`Conducta e Incidencias (${incidents.length})`} />
          <Tab icon={<GradebookIcon />} iconPosition="start" label="Sábana de Calificaciones" />
        </Tabs>
      </Paper>

      {/* =========================================================================
          TAB 0: STUDENTS & BULK IMPORT
         ========================================================================= */}
      {currentTab === 0 && (
        <Card sx={{ borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Lista de Alumnos del Grupo</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Puedes agregar alumnos manualmente o importarlos en bloque desde un examen ya aplicado.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ImportIcon />}
                  onClick={() => setBulkExamModalOpen(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Importar desde Examen
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ImportIcon />}
                  onClick={() => setBulkTextModalOpen(true)}
                  sx={{ fontWeight: 600 }}
                >
                  Importar Lista de Texto
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setStudentModalOpen(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Agregar Alumno
                </Button>
              </Box>
            </Box>

            {students.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Aún no hay alumnos registrados en este grupo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Usa "Importar desde Examen" para cargar los nombres de los alumnos que ya hayan entregado una evaluación.
                </Typography>
                <Button variant="contained" startIcon={<ImportIcon />} onClick={() => setBulkExamModalOpen(true)}>
                  Importar desde Examen
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? '#1E2945' : '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 60 }}># Lista</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nombre Completo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Matrícula / CURP</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estatus</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((std, idx) => (
                      <TableRow key={std.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{std.listNumber || idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{std.fullName}</TableCell>
                        <TableCell>{std.studentIdentifier || '—'}</TableCell>
                        <TableCell>
                          <Chip label="Activo" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Eliminar alumno">
                            <IconButton size="small" color="error" onClick={() => handleDeleteStudent(std.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          TAB 1: PERIODS & WEIGHTS
         ========================================================================= */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          {group?.periods?.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ borderRadius: '12px', border: p.isCurrent ? '2px solid #2563EB' : '1px solid divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.name}</Typography>
                    {p.isCurrent ? (
                      <Chip label="Período Activo" color="primary" size="small" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Button size="small" onClick={() => handleSetActivePeriod(p.id)}>Activar</Button>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Ponderación de Calificación (Suma: {p.examWeight + p.activityWeight + p.attendanceWeight}%)
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Exámenes:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.examWeight}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tareas y Actividades:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.activityWeight}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Asistencia:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.attendanceWeight}%</Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<WeightsIcon />}
                    onClick={() => handleOpenWeights(p)}
                    sx={{ fontWeight: 700 }}
                  >
                    Ajustar Ponderaciones
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* =========================================================================
          TAB 2: ATTENDANCE ROLL-CALL
         ========================================================================= */}
      {currentTab === 2 && (
        <Card sx={{ borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Fecha de Asistencia"
                  type="date"
                  size="small"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    fetchDailyAttendance(e.target.value);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="outlined" size="small" onClick={handleMarkAllPresent}>
                  Marcar Todos Presentes
                </Button>
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveDailyAttendance}
                disabled={attendanceSaving}
                sx={{ fontWeight: 700 }}
              >
                {attendanceSaving ? 'Guardando...' : 'Guardar Asistencia'}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? '#1E2945' : '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Alumno</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Estado de Asistencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceItems.map((item, idx) => (
                    <TableRow key={item.studentId} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{item.listNumber || idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.studentName}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Chip
                            label="Presente"
                            icon={<PresentIcon sx={{ fontSize: '15px !important' }} />}
                            color={item.status === 'PRESENT' ? 'success' : 'default'}
                            variant={item.status === 'PRESENT' ? 'filled' : 'outlined'}
                            onClick={() => handleAttendanceStatusChange(item.studentId, 'PRESENT')}
                            clickable
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                          <Chip
                            label="Falta"
                            icon={<AbsentIcon sx={{ fontSize: '15px !important' }} />}
                            color={item.status === 'ABSENT' ? 'error' : 'default'}
                            variant={item.status === 'ABSENT' ? 'filled' : 'outlined'}
                            onClick={() => handleAttendanceStatusChange(item.studentId, 'ABSENT')}
                            clickable
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                          <Chip
                            label="Retardo"
                            icon={<LateIcon sx={{ fontSize: '15px !important' }} />}
                            color={item.status === 'LATE' ? 'warning' : 'default'}
                            variant={item.status === 'LATE' ? 'filled' : 'outlined'}
                            onClick={() => handleAttendanceStatusChange(item.studentId, 'LATE')}
                            clickable
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                          <Chip
                            label="Justificada"
                            icon={<JustifiedIcon sx={{ fontSize: '15px !important' }} />}
                            color={item.status === 'JUSTIFIED' ? 'info' : 'default'}
                            variant={item.status === 'JUSTIFIED' ? 'filled' : 'outlined'}
                            onClick={() => handleAttendanceStatusChange(item.studentId, 'JUSTIFIED')}
                            clickable
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          TAB 3: ACTIVITIES & EXTRA POINTS
         ========================================================================= */}
      {currentTab === 3 && (
        <Card sx={{ borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Actividades del Período</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tareas, proyectos, participaciones y puntos extra.
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setActivityModalOpen(true)}
                sx={{ fontWeight: 700 }}
              >
                Nueva Actividad
              </Button>
            </Box>

            {activities.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <ActivityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>No hay actividades registradas en este período</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {activities.map((act) => (
                  <Grid item xs={12} sm={6} md={4} key={act.id}>
                    <Card variant="outlined" sx={{ borderRadius: '10px' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip
                            label={act.typeLabel || act.type}
                            size="small"
                            color={act.isExtraPoints ? 'secondary' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {act.maxPoints} pts máx
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{act.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                          Entrega: {act.dueDate ? dayjs(act.dueDate).format('DD/MM/YYYY') : 'Sin fecha límite'}
                        </Typography>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenGrading(act)}
                          sx={{ fontWeight: 700 }}
                        >
                          Calificar Alumnos
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          TAB 4: INCIDENTS & CONDUCT
         ========================================================================= */}
      {currentTab === 4 && (
        <Card sx={{ borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Reportes de Conducta e Incidencias</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Llamados de atención, felicitaciones/méritos y penalizaciones.
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="warning"
                startIcon={<IncidentIcon />}
                onClick={() => setIncidentModalOpen(true)}
                sx={{ fontWeight: 700 }}
              >
                Registrar Incidencia
              </Button>
            </Box>

            {incidents.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <IncidentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Sin incidencias o llamados de atención registrados</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? '#1E2945' : '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Alumno</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Gravedad</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Puntos Restados</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidents.map((inc) => (
                      <TableRow key={inc.id} hover>
                        <TableCell>{dayjs(inc.date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{inc.studentName}</TableCell>
                        <TableCell>
                          <Chip label={inc.typeLabel} size="small" color={inc.type === 'MERITO' ? 'success' : 'warning'} />
                        </TableCell>
                        <TableCell>{inc.severityLabel}</TableCell>
                        <TableCell>{inc.title}</TableCell>
                        <TableCell sx={{ color: inc.pointDeduction > 0 ? 'error.main' : 'inherit', fontWeight: 700 }}>
                          {inc.pointDeduction > 0 ? `-${inc.pointDeduction} pts` : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeleteIncident(inc.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          TAB 5: CONSOLIDATED GRADEBOOK
         ========================================================================= */}
      {currentTab === 5 && (
        <Card sx={{ borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Sábana Consolidada: {selectedPeriod?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Cálculo automático: Exámenes ({selectedPeriod?.examWeight}%) + Actividades ({selectedPeriod?.activityWeight}%) + Asistencia ({selectedPeriod?.attendanceWeight}%) + Puntos Extra.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchGradebook(selectedPeriodId)}
              >
                Recalcular Sábana
              </Button>
            </Box>

            {gradebookLoading ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : !gradebook || !gradebook.rows || gradebook.rows.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="body1">No hay alumnos o registros para este período.</Typography>
              </Box>
            ) : (
              <>
                {/* Stats Row */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: '10px' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {gradebook.groupAverage}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Promedio del Grupo</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: '10px' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                        {gradebook.approvedCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Aprobados (≥ 6.0)</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: '10px' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>
                        {gradebook.failedCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Reprobados</Typography>
                    </Card>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? '#1E2945' : '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Alumno</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Exámenes ({gradebook.examWeight}%)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Actividades ({gradebook.activityWeight}%)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Asistencia ({gradebook.attendanceWeight}%)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Extra / Penaliz.</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>Calificación Final</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Estatus</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradebook.rows.map((row, idx) => (
                        <TableRow key={row.studentId} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{row.listNumber || idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{row.studentName}</TableCell>
                          <TableCell align="center">{row.examsPoints} pts ({row.examsAverage})</TableCell>
                          <TableCell align="center">{row.activitiesPoints} pts ({row.activitiesAverage})</TableCell>
                          <TableCell align="center">{row.attendancePoints} pts ({row.attendancePercentage}%)</TableCell>
                          <TableCell align="center">
                            {row.extraPoints > 0 && <Chip label={`+${row.extraPoints}`} color="success" size="small" sx={{ mr: 0.5, height: 20, fontSize: '0.7rem' }} />}
                            {row.conductPenalties > 0 && <Chip label={`-${row.conductPenalties}`} color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                            {row.extraPoints === 0 && row.conductPenalties === 0 && '—'}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1" sx={{ fontWeight: 900, color: row.isApproved ? 'success.main' : 'error.main' }}>
                              {row.finalGrade}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.isApproved ? 'Aprobado' : 'Reprobado'}
                              color={row.isApproved ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Bulk Import from Exam Modal */}
      <Dialog open={bulkExamModalOpen} onClose={() => setBulkExamModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Importar Alumnos desde un Examen</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Selecciona un examen que ya haya sido aplicado. El sistema extraerá automáticamente todos los nombres únicos de los alumnos que entregaron la evaluación y los registrará en este grupo.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Selecciona el Examen Fuente</InputLabel>
            <Select
              value={selectedExamId}
              label="Selecciona el Examen Fuente"
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {teacherExams.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.title} (Código: {ex.code}) • {ex.submissionCount || 0} entregas
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkExamModalOpen(false)} color="inherit" disabled={importing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBulkImportExam}
            disabled={!selectedExamId || importing}
          >
            {importing ? <CircularProgress size={20} color="inherit" /> : 'Importar Alumnos'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import from Text Modal */}
      <Dialog open={bulkTextModalOpen} onClose={() => setBulkTextModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Importar Lista de Nombres</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Pega una lista de alumnos (un nombre por renglón). Se ordenarán alfabéticamente y se omitirán duplicados automáticamente.
          </Typography>
          <TextField
            multiline
            rows={8}
            fullWidth
            placeholder="Santiago Aguilar&#10;José Ángel Martínez&#10;Dylan Armando Muñoz..."
            value={bulkRawText}
            onChange={(e) => setBulkRawText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkTextModalOpen(false)} color="inherit" disabled={importing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBulkImportText}
            disabled={!bulkRawText.trim() || importing}
          >
            {importing ? <CircularProgress size={20} color="inherit" /> : 'Importar Lista'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Single Student Modal */}
      <Dialog open={studentModalOpen} onClose={() => setStudentModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleAddStudent}>
          <DialogTitle sx={{ fontWeight: 800 }}>Agregar Alumno</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Nombre Completo del Alumno"
              fullWidth
              size="small"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Matrícula o CURP (Opcional)"
              fullWidth
              size="small"
              value={newStudentIdCode}
              onChange={(e) => setNewStudentIdCode(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setStudentModalOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Adjust Weights Modal */}
      <Dialog open={weightsModalOpen} onClose={() => setWeightsModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Configuración de Período y Ponderaciones</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nombre del Período"
            fullWidth
            size="small"
            value={editingPeriodName}
            onChange={(e) => setEditingPeriodName(e.target.value)}
            sx={{ mb: 2.5 }}
            placeholder="Ej: Primer Parcial, Unidad 1, Período 1..."
            helperText="Personaliza el nombre libremente (sin etiquetas fijas)"
          />

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Define qué porcentaje de la calificación final del período representa cada aspecto. La suma debe dar 100%.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Exámenes: {examWeight}%</Typography>
            <Slider value={examWeight} onChange={(_, v) => setExamWeight(v)} min={0} max={100} step={5} valueLabelDisplay="auto" />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Tareas y Actividades: {activityWeight}%</Typography>
            <Slider value={activityWeight} onChange={(_, v) => setActivityWeight(v)} min={0} max={100} step={5} valueLabelDisplay="auto" />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Asistencia: {attendanceWeight}%</Typography>
            <Slider value={attendanceWeight} onChange={(_, v) => setAttendanceWeight(v)} min={0} max={100} step={5} valueLabelDisplay="auto" />
          </Box>

          <Alert severity={examWeight + activityWeight + attendanceWeight === 100 ? 'success' : 'warning'}>
            Suma total: <strong>{examWeight + activityWeight + attendanceWeight}%</strong>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWeightsModalOpen(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSaveWeights}>Guardar Cambios</Button>
        </DialogActions>
      </Dialog>

      {/* Create Activity Modal */}
      <Dialog open={activityModalOpen} onClose={() => setActivityModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleCreateActivity}>
          <DialogTitle sx={{ fontWeight: 800 }}>Nueva Actividad para {selectedPeriod?.name}</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Título de la Actividad"
              placeholder="Ej: Ensayo de Redes, Práctica 1"
              fullWidth
              size="small"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={actType} label="Tipo" onChange={(e) => setActType(e.target.value)}>
                    <MenuItem value="TAREA">Tarea</MenuItem>
                    <MenuItem value="TRABAJO_CLASE">Trabajo en Clase</MenuItem>
                    <MenuItem value="PROYECTO">Proyecto</MenuItem>
                    <MenuItem value="PARTICIPACION">Participación</MenuItem>
                    <MenuItem value="PUNTOS_EXTRA">Puntos Extra (Bono)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Puntaje Máximo"
                  type="number"
                  fullWidth
                  size="small"
                  value={actMaxPoints}
                  onChange={(e) => setActMaxPoints(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Fecha de Entrega"
                  type="date"
                  fullWidth
                  size="small"
                  value={actDueDate}
                  onChange={(e) => setActDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setActivityModalOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">Crear Actividad</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Grade Activity Modal (Quick class grading) */}
      <Dialog open={!!gradingActivity} onClose={() => setGradingActivity(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Calificar: {gradingActivity?.title} (Máx: {gradingActivity?.maxPoints} pts)
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Alumno</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 140 }}>Calificación</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Retroalimentación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentScores.map((sc, idx) => (
                  <TableRow key={sc.studentId}>
                    <TableCell>{sc.listNumber || idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{sc.studentName}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={sc.score}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setStudentScores((prev) =>
                            prev.map((item) =>
                              item.studentId === sc.studentId ? { ...item, score: val } : item
                            )
                          );
                        }}
                        inputProps={{ min: 0, max: gradingActivity?.maxPoints || 10, step: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Comentario opcional..."
                        value={sc.feedback || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentScores((prev) =>
                            prev.map((item) =>
                              item.studentId === sc.studentId ? { ...item, feedback: val } : item
                            )
                          );
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGradingActivity(null)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSaveScores}>Guardar Calificaciones</Button>
        </DialogActions>
      </Dialog>

      {/* Create Incident Modal */}
      <Dialog open={incidentModalOpen} onClose={() => setIncidentModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleCreateIncident}>
          <DialogTitle sx={{ fontWeight: 800 }}>Registrar Incidencia o Llamado de Atención</DialogTitle>
          <DialogContent dividers>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Selecciona al Alumno</InputLabel>
              <Select
                value={incStudentId}
                label="Selecciona al Alumno"
                onChange={(e) => setIncStudentId(e.target.value)}
                required
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.listNumber ? `#${s.listNumber} - ` : ''}{s.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Reporte</InputLabel>
                  <Select value={incType} label="Tipo de Reporte" onChange={(e) => setIncType(e.target.value)}>
                    <MenuItem value="LLAMADO_ATENCION">Llamado de Atención</MenuItem>
                    <MenuItem value="REPORTE_CONDUCTA">Reporte de Conducta</MenuItem>
                    <MenuItem value="MERITO">Reconocimiento / Mérito</MenuItem>
                    <MenuItem value="OBSERVACION">Observación</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gravedad</InputLabel>
                  <Select value={incSeverity} label="Gravedad" onChange={(e) => setIncSeverity(e.target.value)}>
                    <MenuItem value="LEVE">Leve</MenuItem>
                    <MenuItem value="MODERADA">Moderada</MenuItem>
                    <MenuItem value="GRAVE">Grave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Motivo o Título"
              placeholder="Ej: Uso indebido de celular, falta de respeto, participación destacada"
              fullWidth
              size="small"
              value={incTitle}
              onChange={(e) => setIncTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              label="Descripción de lo sucedido"
              multiline
              rows={3}
              fullWidth
              size="small"
              value={incDescription}
              onChange={(e) => setIncDescription(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Penalización en Puntos (Opcional)"
              type="number"
              size="small"
              fullWidth
              value={incDeduction}
              onChange={(e) => setIncDeduction(e.target.value)}
              helperText="Puntos que se restarán a la calificación final del período (ej: 0.5)"
              inputProps={{ min: 0, step: 0.1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIncidentModalOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="warning">Registrar</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')} message={snack} />
    </Container>
  );
}
