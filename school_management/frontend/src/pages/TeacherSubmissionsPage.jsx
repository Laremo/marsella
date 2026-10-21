import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  HelpOutline as PartialIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';
import CodeBlockView from '../components/CodeBlockView';

export default function TeacherSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Detail Modal state
  const [selectedSub, setSelectedSub] = useState(null);
  const [subDetail, setSubDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage('');
    try {
      const [examRes, subsRes] = await Promise.all([
        api.get(`/teacher/exams/${id}`),
        api.get(`/teacher/exams/${id}/submissions`),
      ]);
      setExam(examRes.data);
      setSubmissions(subsRes.data || []);
    } catch (err) {
      console.error('Error fetching submissions', err);
      setErrorMessage(
        err.response?.data?.error ||
        err.message ||
        'Error al cargar las entregas del examen.'
      );
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      setErrorMessage('');
      const response = await api.get(`/teacher/exams/${id}/submissions/export`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = `Calificaciones_${exam?.code || 'examen'}.xlsx`;
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
      setErrorMessage('Error al descargar el archivo de Excel.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleOpenDetail = async (sub) => {
    setSelectedSub(sub);
    setDetailLoading(true);
    try {
      const res = await api.get(`/teacher/exams/${id}/submissions/${sub.id}`);
      setSubDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch submission detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSub(null);
    setSubDetail(null);
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/teacher/dashboard')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Entregas y Calificaciones
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {exam?.title} (Código: <strong>{exam?.code}</strong>)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Actualizar lista de entregas">
            <Button
              variant="outlined"
              size="small"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={() => fetchData(true)}
              disabled={refreshing || downloading}
              sx={{ fontWeight: 600, borderRadius: '8px' }}
            >
              Actualizar
            </Button>
          </Tooltip>

          <Tooltip title="Descargar reporte oficial en hoja de cálculo Excel (.xlsx)">
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <ExportIcon />}
              onClick={handleExportExcel}
              disabled={downloading}
              sx={{ fontWeight: 600, borderRadius: '8px' }}
            >
              Exportar a Excel
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMessage}
        </Alert>
      )}

      {/* Submissions table */}
      <Card sx={{ borderRadius: '12px' }}>
        <CardContent sx={{ p: 0 }}>
          {submissions.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Aún no hay alumnos que hayan presentado este examen
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Comparte el código <strong>{exam?.code}</strong> con tus alumnos para que puedan ingresar.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? '#18223C' : '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Alumno</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hora de Inicio</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hora de Entrega</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Calificación</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Porcentaje</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Detalles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {sub.studentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {dayjs(sub.startedAt).format('DD/MM/YYYY HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {sub.submittedAt
                            ? dayjs(sub.submittedAt).format('DD/MM/YYYY HH:mm:ss')
                            : 'En curso'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.isCompleted ? 'Completado' : 'En Curso (Progreso)'}
                          size="small"
                          color={sub.isCompleted ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {sub.score} / {sub.maxScore} pts
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${sub.percentage}%`}
                          size="small"
                          color={sub.percentage >= 70 ? 'success' : sub.percentage >= 60 ? 'warning' : 'error'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => handleOpenDetail(sub)}
                          disabled={!sub.isCompleted}
                        >
                          Ver Desglose
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Submission Breakdown Modal */}
      <Dialog open={!!selectedSub} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Desglose de Examen - {selectedSub?.studentName}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : !subDetail ? (
            <Typography>No hay detalles disponibles.</Typography>
          ) : (
            <Box>
              {/* Summary Banner */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    Calificación total:{' '}
                    <strong>{subDetail.score} / {subDetail.maxScore} puntos</strong>
                  </Typography>
                  <Chip
                    label={`${subDetail.percentage}% de aciertos`}
                    color={subDetail.percentage >= 70 ? 'success' : 'error'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Paper>

              {/* Questions list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {subDetail.questionResults?.map((qr, idx) => {
                  const isFull = qr.isCorrect;
                  const isZero = qr.awardedPoints === 0;

                  return (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: '10px',
                        borderColor: isFull
                          ? (isDark ? '#166534' : '#86efac')
                          : isZero
                          ? (isDark ? '#991b1b' : '#fca5a5')
                          : (isDark ? '#854d0e' : '#fde047'),
                        bgcolor: isFull
                          ? (isDark ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4')
                          : isZero
                          ? (isDark ? 'rgba(225, 29, 72, 0.12)' : '#fef2f2')
                          : (isDark ? 'rgba(245, 158, 11, 0.12)' : '#fefce8'),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Pregunta {idx + 1}: {qr.prompt}
                        </Typography>
                        <Chip
                          label={`${qr.awardedPoints} / ${qr.maxPoints} pts`}
                          size="small"
                          color={isFull ? 'success' : isZero ? 'error' : 'warning'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {qr.type === 'CODE_BLOCK' && (() => {
                        try {
                          const data = typeof qr.questionData === 'string' ? JSON.parse(qr.questionData) : qr.questionData || {};
                          if (data.code) {
                            return <CodeBlockView code={data.code} language={data.language || 'python'} maxHeight="220px" />;
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Respuesta del Alumno:</strong>{' '}
                          <code>{JSON.stringify(qr.studentAnswer || '(Sin respuesta)')}</code>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Respuesta Correcta Esperada:</strong>{' '}
                          <code>{JSON.stringify(qr.correctAnswer)}</code>
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetail} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
