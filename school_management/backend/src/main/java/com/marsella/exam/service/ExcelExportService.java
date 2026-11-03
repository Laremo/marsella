package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.QuestionResultDto;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.StudentSubmission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelExportService {

    private final ObjectMapper objectMapper;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    public byte[] generateSubmissionsExcel(Exam exam, List<StudentSubmission> submissions) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet("Calificaciones");
            sheet.setDisplayGridlines(true);

            // Palette colors
            byte[] primaryBlue = new byte[]{(byte) 30, (byte) 58, (byte) 138};      // #1E3A8A
            byte[] lightSlate = new byte[]{(byte) 241, (byte) 245, (byte) 249};      // #F1F5F9
            byte[] borderGray = new byte[]{(byte) 203, (byte) 213, (byte) 225};      // #CBD5E1
            byte[] successGreen = new byte[]{(byte) 22, (byte) 101, (byte) 52};      // #166534
            byte[] warningOrange = new byte[]{(byte) 180, (byte) 83, (byte) 9};      // #B45309

            IndexedColorMap colorMap = workbook.getStylesSource().getIndexedColors();
            XSSFColor primaryColor = new XSSFColor(primaryBlue, colorMap);
            XSSFColor lightBgColor = new XSSFColor(lightSlate, colorMap);
            XSSFColor borderColor = new XSSFColor(borderGray, colorMap);
            XSSFColor greenColor = new XSSFColor(successGreen, colorMap);
            XSSFColor orangeColor = new XSSFColor(warningOrange, colorMap);

            // Fonts
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 15);
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());

            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            XSSFFont metaLabelFont = workbook.createFont();
            metaLabelFont.setFontName("Calibri");
            metaLabelFont.setFontHeightInPoints((short) 10);
            metaLabelFont.setBold(true);

            XSSFFont normalFont = workbook.createFont();
            normalFont.setFontName("Calibri");
            normalFont.setFontHeightInPoints((short) 10);

            XSSFFont boldFont = workbook.createFont();
            boldFont.setFontName("Calibri");
            boldFont.setFontHeightInPoints((short) 10);
            boldFont.setBold(true);

            XSSFFont greenBoldFont = workbook.createFont();
            greenBoldFont.setFontName("Calibri");
            greenBoldFont.setFontHeightInPoints((short) 10);
            greenBoldFont.setBold(true);
            greenBoldFont.setColor(greenColor);

            XSSFFont orangeBoldFont = workbook.createFont();
            orangeBoldFont.setFontName("Calibri");
            orangeBoldFont.setFontHeightInPoints((short) 10);
            orangeBoldFont.setBold(true);
            orangeBoldFont.setColor(orangeColor);

            // Cell Styles
            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFillForegroundColor(primaryColor);
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setFont(titleFont);

            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(primaryColor);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setFont(headerFont);
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            XSSFCellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(metaLabelFont);
            metaLabelStyle.setFillForegroundColor(lightBgColor);
            metaLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            metaLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(metaLabelStyle, borderColor);

            XSSFCellStyle metaValueStyle = workbook.createCellStyle();
            metaValueStyle.setFont(normalFont);
            metaValueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(metaValueStyle, borderColor);

            XSSFCellStyle cellTextLeft = workbook.createCellStyle();
            cellTextLeft.setFont(normalFont);
            cellTextLeft.setAlignment(HorizontalAlignment.LEFT);
            cellTextLeft.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(cellTextLeft, borderColor);

            XSSFCellStyle cellTextCenter = workbook.createCellStyle();
            cellTextCenter.setFont(normalFont);
            cellTextCenter.setAlignment(HorizontalAlignment.CENTER);
            cellTextCenter.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(cellTextCenter, borderColor);

            XSSFCellStyle cellCompleted = workbook.createCellStyle();
            cellCompleted.setFont(greenBoldFont);
            cellCompleted.setAlignment(HorizontalAlignment.CENTER);
            cellCompleted.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(cellCompleted, borderColor);

            XSSFCellStyle cellOngoing = workbook.createCellStyle();
            cellOngoing.setFont(orangeBoldFont);
            cellOngoing.setAlignment(HorizontalAlignment.CENTER);
            cellOngoing.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(cellOngoing, borderColor);

            DataFormat df = workbook.createDataFormat();

            XSSFCellStyle cellNumber = workbook.createCellStyle();
            cellNumber.setFont(normalFont);
            cellNumber.setAlignment(HorizontalAlignment.RIGHT);
            cellNumber.setVerticalAlignment(VerticalAlignment.CENTER);
            cellNumber.setDataFormat(df.getFormat("#,##0.0"));
            setThinBorders(cellNumber, borderColor);

            XSSFCellStyle cellPercent = workbook.createCellStyle();
            cellPercent.setFont(boldFont);
            cellPercent.setAlignment(HorizontalAlignment.RIGHT);
            cellPercent.setVerticalAlignment(VerticalAlignment.CENTER);
            cellPercent.setDataFormat(df.getFormat("0.0\"%\""));
            setThinBorders(cellPercent, borderColor);

            XSSFCellStyle summaryLabelStyle = workbook.createCellStyle();
            summaryLabelStyle.setFont(boldFont);
            summaryLabelStyle.setFillForegroundColor(lightBgColor);
            summaryLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            summaryLabelStyle.setAlignment(HorizontalAlignment.RIGHT);
            summaryLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(summaryLabelStyle, borderColor);

            XSSFCellStyle summaryValueStyle = workbook.createCellStyle();
            summaryValueStyle.setFont(boldFont);
            summaryValueStyle.setFillForegroundColor(lightBgColor);
            summaryValueStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            summaryValueStyle.setAlignment(HorizontalAlignment.RIGHT);
            summaryValueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            summaryValueStyle.setDataFormat(df.getFormat("#,##0.0"));
            setThinBorders(summaryValueStyle, borderColor);

            // --- BUILD SHEET CONTENT ---
            int rowIdx = 0;

            // Row 0: Title Banner
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(34);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE OFICIAL DE CALIFICACIONES Y ENTREGAS");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            rowIdx++; // Empty spacing row

            // Metadata Grid (Rows 2 to 6)
            int totalQuestions = exam.getQuestions() != null ? exam.getQuestions().size() : 0;
            String gradeGroup = (exam.getGrade() != null ? exam.getGrade() : "") + " " + (exam.getGroupName() != null ? exam.getGroupName() : "");
            String blockStr = exam.getBlock() != null ? String.valueOf(exam.getBlock()) : "N/A";
            String startDateStr = exam.getStartDate() != null ? exam.getStartDate().format(DATE_TIME_FORMATTER) : "N/A";
            String endDateStr = exam.getEndDate() != null ? exam.getEndDate().format(DATE_TIME_FORMATTER) : "N/A";
            String teacherName = exam.getTeacher() != null ? (exam.getTeacher().getFullName() != null ? exam.getTeacher().getFullName() : exam.getTeacher().getUsername()) : "Docente";

            createMetaRow(sheet, rowIdx++, metaLabelStyle, metaValueStyle, "Examen:", exam.getTitle(), "Código de Acceso:", exam.getCode());
            createMetaRow(sheet, rowIdx++, metaLabelStyle, metaValueStyle, "Grado y Grupo:", gradeGroup.trim(), "Bloque:", blockStr);
            createMetaRow(sheet, rowIdx++, metaLabelStyle, metaValueStyle, "Inicio de Aplicación:", startDateStr, "Fin de Aplicación:", endDateStr);
            createMetaRow(sheet, rowIdx++, metaLabelStyle, metaValueStyle, "Total de Reactivos:", String.valueOf(totalQuestions), "Puntaje Máximo Examen:", String.valueOf(exam.getTotalPoints() != null ? exam.getTotalPoints() : 0.0) + " pts");
            createMetaRow(sheet, rowIdx++, metaLabelStyle, metaValueStyle, "Docente Responsable:", teacherName, "Fecha de Emisión:", LocalDateTime.now().format(DATE_TIME_FORMATTER));

            rowIdx++; // Empty spacing row

            // --- DATA TABLE HEADERS ---
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(26);

            String[] headers = {
                    "#",
                    "Nombre del Alumno",
                    "Grado y Grupo",
                    "Estado",
                    "Inicio del Alumno",
                    "Entrega del Alumno",
                    "Aciertos",
                    "Total Reactivos",
                    "Puntos Obtenidos",
                    "Puntos Máximos",
                    "Calificación (%)"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // --- DATA ROWS ---
            int itemNum = 1;
            double sumScores = 0.0;
            double maxScoreObserved = 0.0;
            double minScoreObserved = Double.MAX_VALUE;
            int completedCount = 0;

            for (StudentSubmission sub : submissions) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                int aciertos = calculateAciertos(sub);
                double score = sub.getScore() != null ? sub.getScore() : 0.0;
                double maxScore = sub.getMaxScore() != null && sub.getMaxScore() > 0 ? sub.getMaxScore() : (exam.getTotalPoints() != null ? exam.getTotalPoints() : 0.0);
                double pct = maxScore > 0 ? Math.round((score / maxScore) * 100.0 * 10.0) / 10.0 : 0.0;
                boolean isCompleted = Boolean.TRUE.equals(sub.getIsCompleted());

                if (isCompleted) {
                    completedCount++;
                    sumScores += score;
                    if (score > maxScoreObserved) maxScoreObserved = score;
                    if (score < minScoreObserved) minScoreObserved = score;
                }

                // 0: #
                Cell c0 = row.createCell(0);
                c0.setCellValue(itemNum++);
                c0.setCellStyle(cellTextCenter);

                // 1: Alumno
                Cell c1 = row.createCell(1);
                c1.setCellValue(sub.getStudentName() != null ? sub.getStudentName() : "");
                c1.setCellStyle(cellTextLeft);

                // 2: Grado y Grupo
                Cell c2 = row.createCell(2);
                c2.setCellValue(gradeGroup.trim());
                c2.setCellStyle(cellTextCenter);

                // 3: Estado
                Cell c3 = row.createCell(3);
                c3.setCellValue(isCompleted ? "Entregado" : "En curso");
                c3.setCellStyle(isCompleted ? cellCompleted : cellOngoing);

                // 4: Inicio del Alumno
                Cell c4 = row.createCell(4);
                c4.setCellValue(sub.getStartedAt() != null ? sub.getStartedAt().format(DATE_TIME_FORMATTER) : "N/A");
                c4.setCellStyle(cellTextCenter);

                // 5: Entrega del Alumno
                Cell c5 = row.createCell(5);
                c5.setCellValue(sub.getSubmittedAt() != null ? sub.getSubmittedAt().format(DATE_TIME_FORMATTER) : "Pendiente");
                c5.setCellStyle(cellTextCenter);

                // 6: Aciertos
                Cell c6 = row.createCell(6);
                c6.setCellValue(aciertos);
                c6.setCellStyle(cellTextCenter);

                // 7: Total Reactivos
                Cell c7 = row.createCell(7);
                c7.setCellValue(totalQuestions);
                c7.setCellStyle(cellTextCenter);

                // 8: Puntos Obtenidos
                Cell c8 = row.createCell(8);
                c8.setCellValue(score);
                c8.setCellStyle(cellNumber);

                // 9: Puntos Máximos
                Cell c9 = row.createCell(9);
                c9.setCellValue(maxScore);
                c9.setCellStyle(cellNumber);

                // 10: Calificación (%)
                Cell c10 = row.createCell(10);
                c10.setCellValue(pct);
                c10.setCellStyle(cellPercent);
            }

            // --- SUMMARY / STATS ROWS ---
            rowIdx++; // Empty spacing row

            double avgScore = completedCount > 0 ? Math.round((sumScores / completedCount) * 10.0) / 10.0 : 0.0;
            if (minScoreObserved == Double.MAX_VALUE) minScoreObserved = 0.0;

            createSummaryRow(sheet, rowIdx++, summaryLabelStyle, summaryValueStyle, "Total de Alumnos Registrados:", submissions.size(), 7, 8);
            createSummaryRow(sheet, rowIdx++, summaryLabelStyle, summaryValueStyle, "Exámenes Finalizados / Entregados:", completedCount, 7, 8);
            createSummaryRow(sheet, rowIdx++, summaryLabelStyle, summaryValueStyle, "Promedio de Puntos Obtenidos:", avgScore, 7, 8);
            createSummaryRow(sheet, rowIdx++, summaryLabelStyle, summaryValueStyle, "Calificación Más Alta Registrada:", maxScoreObserved, 7, 8);
            createSummaryRow(sheet, rowIdx++, summaryLabelStyle, summaryValueStyle, "Calificación Más Baja Registrada:", minScoreObserved, 7, 8);

            // Auto-size columns to fit text comfortably
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Add safety margin
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.min(Math.max(currentWidth + 1200, 3200), 12000));
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private int calculateAciertos(StudentSubmission sub) {
        if (!Boolean.TRUE.equals(sub.getIsCompleted())) {
            return 0;
        }
        if (sub.getGradingDetailsJson() == null || sub.getGradingDetailsJson().isBlank()) {
            return 0;
        }
        try {
            List<QuestionResultDto> results = objectMapper.readValue(
                    sub.getGradingDetailsJson(),
                    new TypeReference<List<QuestionResultDto>>() {}
            );
            return (int) results.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        } catch (Exception e) {
            log.warn("Could not parse grading details for submission {}: {}", sub.getId(), e.getMessage());
            return 0;
        }
    }

    private void createMetaRow(XSSFSheet sheet, int rowIdx, XSSFCellStyle labelStyle, XSSFCellStyle valStyle,
                               String label1, String val1, String label2, String val2) {
        Row row = sheet.createRow(rowIdx);
        row.setHeightInPoints(20);

        // Column 0: Label 1
        Cell c0 = row.createCell(0);
        c0.setCellValue(label1);
        c0.setCellStyle(labelStyle);

        // Columns 1-4: Value 1 (Merged)
        Cell c1 = row.createCell(1);
        c1.setCellValue(val1 != null ? val1 : "");
        c1.setCellStyle(valStyle);
        for (int i = 2; i <= 4; i++) {
            Cell empty = row.createCell(i);
            empty.setCellStyle(valStyle);
        }
        sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 1, 4));

        // Column 5: Label 2
        Cell c5 = row.createCell(5);
        c5.setCellValue(label2);
        c5.setCellStyle(labelStyle);

        // Columns 6-10: Value 2 (Merged)
        Cell c6 = row.createCell(6);
        c6.setCellValue(val2 != null ? val2 : "");
        c6.setCellStyle(valStyle);
        for (int i = 7; i <= 10; i++) {
            Cell empty = row.createCell(i);
            empty.setCellStyle(valStyle);
        }
        sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 6, 10));
    }

    private void createSummaryRow(XSSFSheet sheet, int rowIdx, XSSFCellStyle labelStyle, XSSFCellStyle valStyle,
                                  String label, double value, int labelColStart, int valCol) {
        Row row = sheet.createRow(rowIdx);
        row.setHeightInPoints(20);

        for (int i = labelColStart; i <= valCol + 1; i++) {
            Cell c = row.createCell(i);
            c.setCellStyle(labelStyle);
        }

        Cell labelCell = row.getCell(labelColStart);
        labelCell.setCellValue(label);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, labelColStart, valCol));

        Cell valCell = row.createCell(valCol + 1);
        valCell.setCellValue(value);
        valCell.setCellStyle(valStyle);
    }

    private void setThinBorders(XSSFCellStyle style, XSSFColor color) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(color);
        style.setBottomBorderColor(color);
        style.setLeftBorderColor(color);
        style.setRightBorderColor(color);
    }
}
