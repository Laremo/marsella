import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as WordIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  School as StudentIcon,
  Psychology as TeacherIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../services/api';

export default function ExportExamModal({ open, onClose, exam }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState('');
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWithAnswers, setPreviewWithAnswers] = useState(false);

  if (!exam) return null;

  const handleDownload = async (format, withAnswers) => {
    setDownloading(true);
    setDownloadType(`${format}-${withAnswers ? 'key' : 'student'}`);
    setError('');

    try {
      const endpoint = `/teacher/exams/${exam.id}/export/${format}?withAnswers=${withAnswers}`;
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      const mimeType =
        format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf';

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = `Examen_${exam.code || 'export'}.${format}`;
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
      console.error(`Error exporting exam as ${format}:`, err);
      setError('Ocurrió un error al generar el archivo. Por favor, intenta nuevamente.');
    } finally {
      setDownloading(false);
      setDownloadType('');
    }
  };

  const handleOpenPrintPreview = (withAnswers = false) => {
    setPreviewWithAnswers(withAnswers);
    setPreviewOpen(true);
  };

  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  const gradeGroup = `${exam.grade || ''} ${exam.groupName || ''}`.trim();
  const totalQuestions = exam.questions ? exam.questions.length : 0;
  const totalPoints = exam.totalPoints || 0;

  return (
    <>
      <Dialog
        open={open && !previewOpen}
        onClose={downloading ? undefined : onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            bgcolor: '#1E3A8A',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
              Exportar Examen
            </Typography>
            <Typography variant="caption" sx={{ color: '#E0E7FF' }}>
              Descarga en formato Word editable (.docx) o documento PDF (.pdf) listo para imprimir
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={downloading}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {/* Exam Summary Header */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '10px',
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {exam.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                {gradeGroup ? `Grado y Grupo: ${gradeGroup} • ` : ''}
                {exam.block ? `Bloque: ${exam.block} • ` : ''}
                Código: <strong>{exam.code}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${totalQuestions} reactivos`} size="small" sx={{ fontWeight: 600 }} />
              <Chip
                label={`${totalPoints} pts`}
                size="small"
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* WORD (.DOCX) SECTION */}
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: '#CBD5E1',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <WordIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        Microsoft Word (.docx)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        100% editable en Word, Google Docs o LibreOffice
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5, minHeight: 40 }}>
                    Genera el archivo con membrete institucional, tablas y renglones de respuesta, listo para personalizar o imprimir.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        downloading && downloadType === 'docx-student' ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <StudentIcon />
                        )
                      }
                      disabled={downloading}
                      onClick={() => handleDownload('docx', false)}
                      sx={{
                        bgcolor: '#1E3A8A',
                        '&:hover': { bgcolor: '#172554' },
                        py: 1.2,
                        fontWeight: 700,
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      Versión Alumno (Sin respuestas)
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={
                        downloading && downloadType === 'docx-key' ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <TeacherIcon />
                        )
                      }
                      disabled={downloading}
                      onClick={() => handleDownload('docx', true)}
                      sx={{
                        color: '#15803D',
                        borderColor: '#86EFAC',
                        '&:hover': {
                          borderColor: '#22C55E',
                          bgcolor: '#F0FDF4',
                        },
                        py: 1.2,
                        fontWeight: 700,
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      Clave de Respuestas (Docente)
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* PDF (.PDF) SECTION */}
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: '#CBD5E1',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: '#FEF2F2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PdfIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        Documento PDF (.pdf)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Diseño fijo con paginación oficial listo para imprimir
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5, minHeight: 40 }}>
                    Formato vectorizado de alta resolución con pie de página y encabezados para fotocopiado y aplicación directa.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        downloading && downloadType === 'pdf-student' ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <StudentIcon />
                        )
                      }
                      disabled={downloading}
                      onClick={() => handleDownload('pdf', false)}
                      sx={{
                        bgcolor: '#DC2626',
                        '&:hover': { bgcolor: '#B91C1C' },
                        py: 1.2,
                        fontWeight: 700,
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      Versión Alumno (Sin respuestas)
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={
                        downloading && downloadType === 'pdf-key' ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <TeacherIcon />
                        )
                      }
                      disabled={downloading}
                      onClick={() => handleDownload('pdf', true)}
                      sx={{
                        color: '#15803D',
                        borderColor: '#86EFAC',
                        '&:hover': {
                          borderColor: '#22C55E',
                          bgcolor: '#F0FDF4',
                        },
                        py: 1.2,
                        fontWeight: 700,
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      Clave de Respuestas (Docente)
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Print Preview Banner */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: '10px',
              bgcolor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PrintIcon sx={{ color: '#475569' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  ¿Deseas imprimir o previsualizar directo desde el navegador?
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Abre la vista imprimible con soporte para imprimir o guardar con el diálogo nativo de tu explorador.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenPrintPreview(false)}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Vista Alumno
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenPrintPreview(true)}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Vista Clave
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={onClose}
            disabled={downloading}
            color="inherit"
            sx={{ fontWeight: 600, borderRadius: '8px', textTransform: 'none' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINTABLE PREVIEW MODAL */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          className="no-print"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            py: 1.5,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrintIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Vista de Impresión {previewWithAnswers ? '(Clave de Respuestas)' : '(Versión Alumno)'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleTriggerBrowserPrint}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
            >
              Imprimir / Guardar en PDF
            </Button>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: '#FFFFFF' }}>
          {/* Printable Layout Container */}
          <PrintableExamView exam={exam} withAnswers={previewWithAnswers} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Pure printable view rendered with clean CSS for window.print()
 */
function PrintableExamView({ exam, withAnswers }) {
  const gradeGroup = `${exam.grade || ''} ${exam.groupName || ''}`.trim();
  const totalQuestions = exam.questions ? exam.questions.length : 0;
  const totalPoints = exam.totalPoints || 0;

  return (
    <Box
      sx={{
        fontFamily: 'Calibri, Arial, sans-serif',
        color: '#000',
        '@media print': {
          p: 0,
          color: '#000',
        },
      }}
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-exam-area, .printable-exam-area * {
              visibility: visible;
            }
            .printable-exam-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="printable-exam-area">
        {/* School Header */}
        <Box
          sx={{
            textAlign: 'center',
            p: 2,
            mb: 2,
            bgcolor: '#1E3A8A',
            color: 'white',
            borderRadius: '6px',
            '@media print': {
              bgcolor: '#1E3A8A !important',
              color: 'white !important',
              WebkitPrintColorAdjust: 'exact',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>
            COLEGIO MARSELLA
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: '#FDE047' }}>
            {exam.title ? exam.title.toUpperCase() : 'EVALUACIÓN ACADÉMICA'}
          </Typography>
          {withAnswers && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>
              ★ GUÍA OFICIAL Y CLAVE DE RESPUESTAS (USO EXCLUSIVO DEL DOCENTE) ★
            </Typography>
          )}
        </Box>

        {/* Metadata Table */}
        <Box
          sx={{
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            p: 1.5,
            mb: 2.5,
            bgcolor: '#F8FAFC',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <strong>Docente:</strong>{' '}
              {exam.teacher?.fullName || exam.teacher?.username || 'Docente'}
            </Grid>
            <Grid item xs={6}>
              <strong>Grado / Grupo:</strong> {gradeGroup || 'N/A'}
            </Grid>
            <Grid item xs={6}>
              <strong>Periodo:</strong> {exam.block ? `Bloque ${exam.block}` : 'General'}
            </Grid>
            <Grid item xs={6}>
              <strong>Puntaje Máximo:</strong> {totalPoints} pts ({totalQuestions} reactivos)
            </Grid>

            {!withAnswers ? (
              <>
                <Grid item xs={8} sx={{ mt: 1 }}>
                  <strong>Nombre del Alumno:</strong> _________________________________________________
                </Grid>
                <Grid item xs={4} sx={{ mt: 1 }}>
                  <strong>N.L.:</strong> ______ <strong>Fecha:</strong> ____________
                </Grid>
                <Grid item xs={12} sx={{ mt: 1, pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                  <strong>Instrucciones:</strong>{' '}
                  {exam.description ||
                    'Lee cuidadosamente cada reactivo antes de contestar. Responde con claridad y verifica tus respuestas antes de entregar.'}
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sx={{ mt: 1, pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                <strong>Código de Examen:</strong> {exam.code} • <em>Respuestas correctas marcadas en verde.</em>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Questions List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {exam.questions &&
            exam.questions.map((q, idx) => (
              <PrintableQuestionItem
                key={q.id || idx}
                question={q}
                order={idx + 1}
                withAnswers={withAnswers}
              />
            ))}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
            pt: 2,
            borderTop: '1px solid #E2E8F0',
            color: '#64748B',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}
        >
          {withAnswers
            ? '--- Fin de la Clave de Respuestas ---'
            : '--- Fin del Examen. ¡Mucho Éxito! ---'}
        </Box>
      </div>
    </Box>
  );
}

function PrintableQuestionItem({ question, order, withAnswers }) {
  let qData = {};
  let cData = null;

  try {
    qData = typeof question.questionData === 'string'
      ? JSON.parse(question.questionData)
      : question.questionData || {};
  } catch (e) {
    qData = {};
  }

  try {
    cData = typeof question.correctAnswer === 'string'
      ? JSON.parse(question.correctAnswer)
      : question.correctAnswer;
  } catch (e) {
    cData = question.correctAnswer;
  }

  const type = question.type || 'MULTIPLE_CHOICE';

  return (
    <Box sx={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: '#1E3A8A' }}>
          {order}.
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {question.prompt}
        </Typography>
        <Chip
          label={`${question.points || 1} pt${question.points === 1 ? '' : 's'}`}
          size="small"
          sx={{ height: 22, fontSize: '0.75rem', bgcolor: '#F1F5F9' }}
        />
      </Box>

      {/* Image if present */}
      {question.imageUrl && (
        <Box sx={{ my: 1.5, textAlign: 'center' }}>
          <img
            src={question.imageUrl}
            alt={`Reactivo ${order}`}
            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 6, objectFit: 'contain' }}
          />
        </Box>
      )}

      {/* Body per Question Type */}
      <Box sx={{ pl: 3 }}>
        {type === 'MULTIPLE_CHOICE' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {(qData.options || []).map((opt, optIdx) => {
              const letter = String.fromCharCode(97 + optIdx);
              const isCorrect =
                withAnswers &&
                (Array.isArray(cData) ? cData.includes(opt) : cData === opt);

              return (
                <Box
                  key={optIdx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: isCorrect ? '#15803D' : 'inherit',
                    fontWeight: isCorrect ? 700 : 400,
                  }}
                >
                  <span>
                    {letter}) {opt} {isCorrect && '✓ (CORRECTA)'}
                  </span>
                </Box>
              );
            })}
          </Box>
        )}

        {type === 'TRUE_FALSE' && (
          <Box sx={{ display: 'flex', gap: 4, my: 0.5 }}>
            {['Verdadero', 'Falso'].map((label) => {
              const val = label === 'Verdadero';
              const isCorrect = withAnswers && (cData === val || String(cData) === String(val));
              return (
                <Box
                  key={label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: isCorrect ? '#15803D' : 'inherit',
                    fontWeight: isCorrect ? 700 : 400,
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>
                    {isCorrect ? '( X )' : '(   )'}
                  </span>
                  <span>
                    {label} {isCorrect && '✓'}
                  </span>
                </Box>
              );
            })}
          </Box>
        )}

        {type === 'CODE_BLOCK' && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontFamily: 'Consolas, monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 0.5, color: '#64748B', fontWeight: 700 }}
              >
                [{qData.language ? qData.language.toUpperCase() : 'CÓDIGO'}]
              </Typography>
              {qData.code}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {(qData.options || []).map((opt, optIdx) => {
                const letter = String.fromCharCode(97 + optIdx);
                const isCorrect =
                  withAnswers &&
                  (Array.isArray(cData) ? cData.includes(opt) : cData === opt);

                return (
                  <Box
                    key={optIdx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: isCorrect ? '#15803D' : 'inherit',
                      fontWeight: isCorrect ? 700 : 400,
                    }}
                  >
                    <span>
                      {letter}) {opt} {isCorrect && '✓ (CORRECTA)'}
                    </span>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {type === 'RELATE_COLUMNS' && (
          <Box sx={{ my: 1 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
                border: '1px solid #CBD5E1',
              }}
            >
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #CBD5E1' }}>
                    Columna A (Concepto)
                  </th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #CBD5E1' }}>
                    Columna B (Definición)
                  </th>
                </tr>
              </thead>
              <tbody>
                {cData && typeof cData === 'object' && !Array.isArray(cData) ? (
                  Object.entries(cData).map(([left, right], pIdx) => (
                    <tr key={pIdx}>
                      <td style={{ padding: '6px 10px', border: '1px solid #CBD5E1' }}>
                        ( &nbsp; ) &nbsp; {pIdx + 1}. {left}
                      </td>
                      <td style={{ padding: '6px 10px', border: '1px solid #CBD5E1' }}>
                        {String.fromCharCode(65 + pIdx)}) {right}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ padding: 8 }}>
                      Relaciona los elementos correspondientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {withAnswers && cData && typeof cData === 'object' && !Array.isArray(cData) && (
              <Box sx={{ mt: 1, color: '#15803D', fontSize: '0.85rem' }}>
                <strong>Relación correcta:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                  {Object.entries(cData).map(([left, right], pIdx) => (
                    <li key={pIdx}>
                      {pIdx + 1}. "{left}" ➔ "{right}"
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}

        {type === 'FILL_BLANKS' && (
          <Box sx={{ my: 1, lineHeight: 1.8 }}>
            <Typography variant="body1">
              {!withAnswers
                ? (qData.template || question.prompt || '').replace(/\[[^\]]+\]/g, '___________________')
                : qData.template || question.prompt}
            </Typography>
            {withAnswers && cData && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, color: '#15803D', fontWeight: 700 }}
              >
                Respuestas correctas: {Array.isArray(cData) ? cData.join(', ') : String(cData)}
              </Typography>
            )}
          </Box>
        )}

        {type === 'OPEN_TEXT' && (
          <Box sx={{ my: 1 }}>
            {!withAnswers ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ borderBottom: '1px solid #94A3B8', height: 20 }} />
                <Box sx={{ borderBottom: '1px solid #94A3B8', height: 20 }} />
                <Box sx={{ borderBottom: '1px solid #94A3B8', height: 20 }} />
              </Box>
            ) : (
              <Box sx={{ color: '#15803D', fontSize: '0.9rem' }}>
                <strong>Respuesta esperada / Criterio:</strong>{' '}
                <em>{cData ? String(cData) : '(Sin criterio específico)'}</em>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
