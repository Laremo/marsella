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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  ContentCopy as CopyIcon,
  ControlPointDuplicate as CloneIcon,
  Lock as LockIcon,
  CheckCircle as ActiveIcon,
  Schedule as ScheduledIcon,
  HourglassBottom as ExpiredIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboardPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [copySnack, setCopySnack] = useState('');
  const [cloneExam, setCloneExam] = useState(null);
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneGrade, setCloneGrade] = useState('');
  const [cloneGroup, setCloneGroup] = useState('');
  const [cloneStartDate, setCloneStartDate] = useState('');
  const [cloneEndDate, setCloneEndDate] = useState('');
  const [cloneCode, setCloneCode] = useState('');
  const [cloneIsActive, setCloneIsActive] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fetchExams = async () => {
    try {
      const res = await api.get('/teacher/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Error fetching exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopySnack(`¡Código ${code} copiado al portapapeles!`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/teacher/exams/${deleteId}`);
      setExams(exams.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete exam', err);
      setDeleteError(err.response?.data?.error || 'No se pudo eliminar el examen.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportExcel = async (exam) => {
    try {
      const response = await api.get(`/teacher/exams/${exam.id}/submissions/export`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = `Calificaciones_${exam.code || 'examen'}.xlsx`;
      const disposition = response.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading excel report', err);
      setCopySnack('Error al descargar el archivo de Excel.');
    }
  };

  const handleOpenCloneModal = (exam) => {
    let nextGroup = 'B';
    if (exam.groupName) {
      const g = exam.groupName.trim().toUpperCase();
      if (g === 'A') nextGroup = 'B';
      else if (g === 'B') nextGroup = 'C';
      else if (g === 'C') nextGroup = 'D';
      else nextGroup = exam.groupName;
    }
    setCloneExam(exam);
    setCloneTitle(`${exam.title} (Grupo ${nextGroup})`);
    setCloneGrade(exam.grade || '2do');
    setCloneGroup(nextGroup);

    const nowLocal = dayjs();
    const durationHours = dayjs(exam.endDate).diff(dayjs(exam.startDate), 'hour') || 2;
    setCloneStartDate(nowLocal.format('YYYY-MM-DDTHH:mm'));
    setCloneEndDate(nowLocal.add(durationHours, 'hour').format('YYYY-MM-DDTHH:mm'));
    setCloneCode('');
    setCloneIsActive(true);
    setCloneError('');
  };

  const handleCloneSubmit = async () => {
    if (!cloneExam) return;
    if (!cloneTitle.trim()) {
      setCloneError('El título es obligatorio.');
      return;
    }
    if (!cloneStartDate || !cloneEndDate) {
      setCloneError('Las fechas de inicio y fin son obligatorias.');
      return;
    }
    if (dayjs(cloneEndDate).isBefore(dayjs(cloneStartDate))) {
      setCloneError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    setCloning(true);
    setCloneError('');
    try {
      const payload = {
        title: cloneTitle.trim(),
        grade: cloneGrade.trim(),
        groupName: cloneGroup.trim(),
        block: cloneExam.block || 1,
        startDate: dayjs(cloneStartDate).toISOString(),
        endDate: dayjs(cloneEndDate).toISOString(),
        code: cloneCode.trim() ? cloneCode.trim().toUpperCase() : null,
        isActive: cloneIsActive,
      };
      const res = await api.post(`/teacher/exams/${cloneExam.id}/clone`, payload);
      setCopySnack(`¡Examen clonado con éxito para el Grupo ${cloneGroup}! Código: ${res.data.code}`);
      setCloneExam(null);
      fetchExams();
    } catch (err) {
      console.error('Failed to clone exam', err);
      setCloneError(err.response?.data?.error || 'No se pudo clonar el examen.');
    } finally {
      setCloning(false);
    }
  };

  const now = dayjs();

  // Metrics
  const totalExams = exams.length;
  const activeExams = exams.filter((e) => dayjs(e.startDate).isBefore(now) && dayjs(e.endDate).isAfter(now)).length;
  const totalSubmissions = exams.reduce((acc, curr) => acc + (curr.submissionCount || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Panel de Exámenes
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Bienvenido, {user?.fullName || user?.username}. Gestiona tus evaluaciones escolares.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/teacher/exams/new')}
          sx={{ fontWeight: 700 }}
        >
          Crear Examen
        </Button>
      </Box>

      {/* Compact Metrics Bar in a single line */}
      <Paper
        variant="outlined"
        sx={{
          py: 1.25,
          px: 2.5,
          mb: 3,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 2, sm: 3 },
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <span>Total de exámenes:</span>
          <strong style={{ color: isDark ? '#F8FAFC' : '#141B34', fontWeight: 800 }}>{totalExams}</strong>
        </Typography>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, height: 16, my: 'auto' }} />

        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <span>Activos / En curso:</span>
          <strong style={{ color: isDark ? '#4ade80' : '#16a34a', fontWeight: 800 }}>{activeExams}</strong>
        </Typography>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, height: 16, my: 'auto' }} />

        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <span>Entregas recibidas:</span>
          <strong style={{ color: isDark ? '#93c5fd' : '#2563eb', fontWeight: 800 }}>{totalSubmissions}</strong>
        </Typography>
      </Paper>

      {/* Exams List */}
      <Card sx={{ borderRadius: '12px' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : exams.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Aún no has creado ningún examen
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Diseña tu primer examen con preguntas de opción múltiple, columnas y más.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/teacher/exams/new')}
              >
                Crear Primer Examen
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? '#18223C' : '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Examen</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Preguntas / Puntos</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fechas de Aplicación</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Entregas</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.map((exam) => {
                    const start = dayjs(exam.startDate);
                    const end = dayjs(exam.endDate);
                    const isUpcoming = now.isBefore(start);
                    const isFinished = now.isAfter(end);
                    const isOngoing = !isUpcoming && !isFinished;
                    const canEdit = true;

                    return (
                      <TableRow key={exam.id} hover>
                        {/* Title */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={`Bloque ${exam.block || 1}`}
                              size="small"
                              color="secondary"
                              sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                            />
                            {(exam.grade || exam.groupName) && (
                              <Chip
                                label={`${exam.grade || '2do'} ${exam.groupName ? '• ' + exam.groupName : ''}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {exam.title}
                          </Typography>
                          {exam.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {exam.description.slice(0, 60)}{exam.description.length > 60 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Code */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              label={exam.code}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                letterSpacing: 0.5,
                                bgcolor: isDark ? 'rgba(75, 119, 216, 0.2)' : '#eff6ff',
                                color: isDark ? '#7398E6' : 'primary.main',
                              }}
                            />
                            <Tooltip title="Copiar código para los alumnos">
                              <IconButton size="small" onClick={(e) => handleCopyCode(exam.code, e)}>
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Questions & Points */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {exam.questions?.length || 0} preguntas
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {exam.totalPoints} pts total
                          </Typography>
                        </TableCell>

                        {/* Dates */}
                        <TableCell>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                            De: {start.format('DD/MM/YYYY HH:mm')}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            A: {end.format('DD/MM/YYYY HH:mm')}
                          </Typography>
                        </TableCell>

                        {/* Status & Active state */}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                            {/* Active toggle status */}
                            {exam.isActive ? (
                              <Chip
                                label="Activo"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                              />
                            ) : (
                              <Chip
                                label="Inactivo"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}
                              />
                            )}

                            {/* Schedule status */}
                            {isOngoing && (
                              <Chip
                                icon={<ActiveIcon sx={{ fontSize: '15px !important', color: 'white !important' }} />}
                                label="En curso"
                                size="small"
                                sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                              />
                            )}
                            {isUpcoming && (
                              <Chip
                                icon={<ScheduledIcon sx={{ fontSize: '15px !important' }} />}
                                label="Programado"
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                              />
                            )}
                            {isFinished && (
                              <Chip
                                label="Finalizado"
                                size="small"
                                sx={{ bgcolor: isDark ? '#1E2945' : '#e2e8f0', color: isDark ? '#94a3b8' : '#475569', fontWeight: 600, height: 22, fontSize: '0.72rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>

                        {/* Submissions count */}
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                            sx={{ fontWeight: 600 }}
                          >
                            {exam.submissionCount || 0} alumnos
                          </Button>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Descargar calificaciones en Excel">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleExportExcel(exam)}
                              >
                                <ExportIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Clonar examen para otro grupo">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenCloneModal(exam)}
                              >
                                <CloneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar examen">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar examen">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(exam.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Eliminar este examen?</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2">
            Esta acción eliminará el examen permanentemente junto con todas las preguntas y registros de alumnos asociados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Sí, Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Exam Dialog */}
      <Dialog
        open={!!cloneExam}
        onClose={() => !cloning && setCloneExam(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Clonar Examen para otro Grupo
        </DialogTitle>
        <DialogContent dividers>
          {cloneError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {cloneError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Se duplicarán todas las preguntas, valores de aciertos y opciones de respuesta del examen original. Especifica los detalles y fechas para la nueva aplicación.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Título del Examen"
                fullWidth
                size="small"
                value={cloneTitle}
                onChange={(e) => setCloneTitle(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Grado (ej. 1ro, 2do)"
                fullWidth
                size="small"
                value={cloneGrade}
                onChange={(e) => setCloneGrade(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Grupo (ej. B, C)"
                fullWidth
                size="small"
                value={cloneGroup}
                onChange={(e) => setCloneGroup(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Fecha de Inicio"
                type="datetime-local"
                fullWidth
                size="small"
                value={cloneStartDate}
                onChange={(e) => setCloneStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Fecha de Fin"
                type="datetime-local"
                fullWidth
                size="small"
                value={cloneEndDate}
                onChange={(e) => setCloneEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Código de Acceso (Opcional)"
                fullWidth
                size="small"
                value={cloneCode}
                onChange={(e) => setCloneCode(e.target.value.toUpperCase())}
                placeholder="Dejar vacío para generar uno automático"
                helperText="Si lo dejas vacío, el sistema generará un nuevo código único al azar"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={cloneIsActive}
                    onChange={(e) => setCloneIsActive(e.target.checked)}
                    color="primary"
                  />
                }
                label="Activar examen inmediatamente"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            size="small"
            color="secondary"
            onClick={() => {
              const srcId = cloneExam?.id;
              setCloneExam(null);
              navigate(`/teacher/exams/new?cloneFrom=${srcId}`);
            }}
            disabled={cloning}
          >
            Abrir en Editor Completo
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCloneExam(null)} color="inherit" disabled={cloning}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloneSubmit}
              color="primary"
              variant="contained"
              disabled={cloning}
              startIcon={<CloneIcon />}
            >
              {cloning ? <CircularProgress size={20} color="inherit" /> : 'Clonar Examen'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Toast notification for copy */}
      <Snackbar
        open={!!copySnack}
        autoHideDuration={3000}
        onClose={() => setCopySnack('')}
        message={copySnack}
      />
    </Container>
  );
}
