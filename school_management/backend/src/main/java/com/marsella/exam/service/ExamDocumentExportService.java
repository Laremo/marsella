package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.Question;
import com.marsella.exam.model.QuestionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamDocumentExportService {

    private final ObjectMapper objectMapper;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ==========================================
    // 1. GENERATE WORD (.DOCX)
    // ==========================================
    public byte[] generateExamDocx(Exam exam, boolean withAnswers) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Configure 1-inch margins
            CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
            CTPageMar pageMar = sectPr.addNewPgMar();
            pageMar.setLeft(BigInteger.valueOf(1080));  // ~0.75 in
            pageMar.setRight(BigInteger.valueOf(1080));
            pageMar.setTop(BigInteger.valueOf(1080));
            pageMar.setBottom(BigInteger.valueOf(1080));

            // Header Banner Table
            XWPFTable headerTable = doc.createTable(1, 1);
            headerTable.setWidth("100%");
            XWPFTableRow headerRow = headerTable.getRow(0);
            XWPFTableCell headerCell = headerRow.getCell(0);
            headerCell.setColor("1E3A8A"); // Navy blue background

            XWPFParagraph pInst = headerCell.getParagraphs().get(0);
            pInst.setAlignment(ParagraphAlignment.CENTER);
            pInst.setSpacingBefore(120);
            pInst.setSpacingAfter(40);
            XWPFRun rInst = pInst.createRun();
            rInst.setText("COLEGIO MARSELLA");
            rInst.setBold(true);
            rInst.setFontSize(14);
            rInst.setFontFamily("Calibri");
            rInst.setColor("FFFFFF");

            XWPFParagraph pTitle = headerCell.addParagraph();
            pTitle.setAlignment(ParagraphAlignment.CENTER);
            pTitle.setSpacingAfter(60);
            XWPFRun rTitle = pTitle.createRun();
            rTitle.setText(exam.getTitle() != null ? exam.getTitle().toUpperCase() : "EVALUACIÓN ACADÉMICA");
            rTitle.setBold(true);
            rTitle.setFontSize(12);
            rTitle.setFontFamily("Calibri");
            rTitle.setColor("FDE047"); // Soft yellow accent

            if (withAnswers) {
                XWPFParagraph pKey = headerCell.addParagraph();
                pKey.setAlignment(ParagraphAlignment.CENTER);
                pKey.setSpacingAfter(100);
                XWPFRun rKey = pKey.createRun();
                rKey.setText("★ GUÍA OFICIAL Y CLAVE DE RESPUESTAS (USO EXCLUSIVO DEL DOCENTE) ★");
                rKey.setBold(true);
                rKey.setFontSize(10);
                rKey.setFontFamily("Calibri");
                rKey.setColor("FFFFFF");
            }

            // Spacing
            XWPFParagraph spaceP = doc.createParagraph();
            spaceP.setSpacingBefore(100);
            spaceP.setSpacingAfter(80);

            // Metadata Table
            XWPFTable metaTable = doc.createTable(3, 2);
            metaTable.setWidth("100%");
            setTableBorders(metaTable);

            String gradeGroup = ((exam.getGrade() != null ? exam.getGrade() : "") + " " + (exam.getGroupName() != null ? exam.getGroupName() : "")).trim();
            String blockStr = exam.getBlock() != null ? "Bloque " + exam.getBlock() : "General";
            String teacherName = exam.getTeacher() != null ? (exam.getTeacher().getFullName() != null ? exam.getTeacher().getFullName() : exam.getTeacher().getUsername()) : "Docente";
            String totalPointsStr = (exam.getTotalPoints() != null ? exam.getTotalPoints() : 0.0) + " pts";
            int totalQuestions = exam.getQuestions() != null ? exam.getQuestions().size() : 0;

            fillMetaCell(metaTable.getRow(0).getCell(0), "Docente:", teacherName);
            fillMetaCell(metaTable.getRow(0).getCell(1), "Grado / Grupo:", gradeGroup.isEmpty() ? "N/A" : gradeGroup);
            fillMetaCell(metaTable.getRow(1).getCell(0), "Periodo / Bloque:", blockStr);
            fillMetaCell(metaTable.getRow(1).getCell(1), "Puntaje Máximo:", totalPointsStr + " (" + totalQuestions + " reactivos)");

            if (!withAnswers) {
                fillMetaCell(metaTable.getRow(2).getCell(0), "Nombre del Alumno:", "______________________________________________________");
                fillMetaCell(metaTable.getRow(2).getCell(1), "Fecha / Calificación:", "____ / ____ / 202___     [ _____ / " + totalPointsStr + " ]");

                // Instructions Box
                XWPFParagraph pInstBox = doc.createParagraph();
                pInstBox.setSpacingBefore(120);
                pInstBox.setSpacingAfter(160);
                XWPFRun rInstLabel = pInstBox.createRun();
                rInstLabel.setText("Instrucciones: ");
                rInstLabel.setBold(true);
                rInstLabel.setFontSize(10);
                rInstLabel.setFontFamily("Calibri");

                XWPFRun rInstText = pInstBox.createRun();
                rInstText.setText(exam.getDescription() != null && !exam.getDescription().isBlank()
                        ? exam.getDescription()
                        : "Lee cuidadosamente cada reactivo antes de contestar. Responde con claridad y verifica tus respuestas antes de entregar.");
                rInstText.setFontSize(10);
                rInstText.setFontFamily("Calibri");
            } else {
                fillMetaCell(metaTable.getRow(2).getCell(0), "Código de Examen:", exam.getCode() != null ? exam.getCode() : "N/A");
                fillMetaCell(metaTable.getRow(2).getCell(1), "Total de Reactivos:", String.valueOf(totalQuestions));

                XWPFParagraph pInstBox = doc.createParagraph();
                pInstBox.setSpacingBefore(100);
                pInstBox.setSpacingAfter(140);
                XWPFRun rNote = pInstBox.createRun();
                rNote.setText("Nota para el docente: Esta clave contiene las respuestas correctas destacadas en verde/negrita, junto con los criterios y puntajes asignados.");
                rNote.setItalic(true);
                rNote.setFontSize(10);
                rNote.setColor("4B5563");
            }

            // Divider line
            XWPFParagraph dividerP = doc.createParagraph();
            dividerP.setBorderBottom(Borders.SINGLE);
            dividerP.setSpacingAfter(160);

            // Render Questions
            List<Question> questions = exam.getQuestions() != null ? exam.getQuestions() : Collections.emptyList();
            for (int i = 0; i < questions.size(); i++) {
                Question q = questions.get(i);
                renderQuestionDocx(doc, q, i + 1, withAnswers);
            }

            // Footer notes
            XWPFParagraph footerP = doc.createParagraph();
            footerP.setAlignment(ParagraphAlignment.CENTER);
            footerP.setSpacingBefore(300);
            XWPFRun rFooter = footerP.createRun();
            rFooter.setText(withAnswers ? "--- Fin de la Clave de Respuestas ---" : "--- Fin del Examen. ¡Mucho Éxito! ---");
            rFooter.setFontSize(9);
            rFooter.setItalic(true);
            rFooter.setColor("64748B");

            doc.write(out);
            return out.toByteArray();
        }
    }

    private void renderQuestionDocx(XWPFDocument doc, Question q, int order, boolean withAnswers) {
        double points = q.getPoints() != null ? q.getPoints() : 0.0;
        String prompt = q.getPrompt() != null ? q.getPrompt().trim() : "";

        // Question Title paragraph
        XWPFParagraph qTitleP = doc.createParagraph();
        qTitleP.setSpacingBefore(140);
        qTitleP.setSpacingAfter(40);

        XWPFRun rNum = qTitleP.createRun();
        rNum.setText(order + ". ");
        rNum.setBold(true);
        rNum.setFontSize(11);
        rNum.setFontFamily("Calibri");
        rNum.setColor("1E3A8A");

        XWPFRun rPrompt = qTitleP.createRun();
        rPrompt.setText(prompt + " ");
        rPrompt.setBold(true);
        rPrompt.setFontSize(11);
        rPrompt.setFontFamily("Calibri");

        XWPFRun rPoints = qTitleP.createRun();
        rPoints.setText("(" + points + " pt" + (points == 1.0 ? "" : "s") + ")");
        rPoints.setFontSize(9.5);
        rPoints.setColor("475569");
        rPoints.setBold(false);

        // Parse Question Data & Correct Answer
        Map<String, Object> qData = parseJsonMap(q.getQuestionData());
        Object cData = parseJsonValue(q.getCorrectAnswer());

        QuestionType type = q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE;

        switch (type) {
            case MULTIPLE_CHOICE: {
                List<String> options = extractOptions(qData);
                List<String> correctOptions = extractStringList(cData);

                char optLetter = 'a';
                for (String opt : options) {
                    XWPFParagraph optP = doc.createParagraph();
                    optP.setIndentationLeft(360);
                    optP.setSpacingAfter(30);

                    boolean isCorrect = withAnswers && isOptionCorrect(opt, correctOptions);

                    XWPFRun rText = optP.createRun();
                    rText.setText(optLetter + ") " + opt + (isCorrect ? "  ✓ (CORRECTA)" : ""));
                    rText.setFontFamily("Calibri");
                    rText.setFontSize(10.5);
                    if (isCorrect) {
                        rText.setBold(true);
                        rText.setColor("15803D");
                    }
                    optLetter++;
                }
                break;
            }
            case TRUE_FALSE: {
                boolean correctIsTf = parseBooleanAnswer(cData);

                XWPFParagraph tfP = doc.createParagraph();
                tfP.setIndentationLeft(360);
                tfP.setSpacingAfter(40);

                XWPFRun rV = tfP.createRun();
                rV.setText((withAnswers && correctIsTf ? "( X ) " : "(   ) ") + "Verdadero" + (withAnswers && correctIsTf ? "  ✓" : ""));
                rV.setFontFamily("Calibri");
                rV.setFontSize(10.5);
                if (withAnswers && correctIsTf) {
                    rV.setBold(true);
                    rV.setColor("15803D");
                }

                XWPFRun rSep = tfP.createRun();
                rSep.setText("             ");

                XWPFRun rF = tfP.createRun();
                rF.setText((withAnswers && !correctIsTf ? "( X ) " : "(   ) ") + "Falso" + (withAnswers && !correctIsTf ? "  ✓" : ""));
                rF.setFontFamily("Calibri");
                rF.setFontSize(10.5);
                if (withAnswers && !correctIsTf) {
                    rF.setBold(true);
                    rF.setColor("15803D");
                }
                break;
            }
            case CODE_BLOCK: {
                String code = qData.get("code") != null ? String.valueOf(qData.get("code")) : "";
                String lang = qData.get("language") != null ? String.valueOf(qData.get("language")).toUpperCase() : "CÓDIGO";

                // Code box table
                XWPFTable codeTable = doc.createTable(1, 1);
                codeTable.setWidth("95%");
                XWPFTableCell cell = codeTable.getRow(0).getCell(0);
                cell.setColor("F8FAFC"); // Light slate

                XWPFParagraph pLang = cell.getParagraphs().get(0);
                pLang.setSpacingBefore(40);
                pLang.setSpacingAfter(20);
                XWPFRun rLang = pLang.createRun();
                rLang.setText("[" + lang + "]");
                rLang.setFontSize(8.5);
                rLang.setBold(true);
                rLang.setColor("64748B");

                for (String codeLine : code.split("\\r?\\n")) {
                    XWPFParagraph pCode = cell.addParagraph();
                    pCode.setSpacingAfter(10);
                    XWPFRun rCode = pCode.createRun();
                    rCode.setText(codeLine);
                    rCode.setFontFamily("Consolas");
                    rCode.setFontSize(9.5);
                    rCode.setColor("0F172A");
                }

                // Options
                List<String> options = extractOptions(qData);
                List<String> correctOptions = extractStringList(cData);

                char optLetter = 'a';
                for (String opt : options) {
                    XWPFParagraph optP = doc.createParagraph();
                    optP.setIndentationLeft(360);
                    optP.setSpacingAfter(30);

                    boolean isCorrect = withAnswers && isOptionCorrect(opt, correctOptions);

                    XWPFRun rText = optP.createRun();
                    rText.setText(optLetter + ") " + opt + (isCorrect ? "  ✓ (CORRECTA)" : ""));
                    rText.setFontFamily("Calibri");
                    rText.setFontSize(10.5);
                    if (isCorrect) {
                        rText.setBold(true);
                        rText.setColor("15803D");
                    }
                    optLetter++;
                }
                break;
            }
            case RELATE_COLUMNS: {
                Map<String, String> pairs = parsePairs(cData, qData);

                XWPFTable pairTable = doc.createTable(pairs.size() + 1, 2);
                pairTable.setWidth("96%");
                setTableBorders(pairTable);

                pairTable.getRow(0).getCell(0).setText("Columna A (Concepto / Premisa)");
                pairTable.getRow(0).getCell(1).setText("Columna B (Definición / Respuesta)");

                int rowIdx = 1;
                char rightLetter = 'A';
                List<String> rightValues = new ArrayList<>(pairs.values());
                if (!withAnswers) {
                    Collections.shuffle(rightValues);
                }

                for (Map.Entry<String, String> entry : pairs.entrySet()) {
                    XWPFTableRow r = pairTable.getRow(rowIdx);
                    XWPFTableCell c0 = r.getCell(0);
                    XWPFTableCell c1 = r.getCell(1);

                    String leftPrompt = "(   )  " + rowIdx + ". " + entry.getKey();
                    c0.setText(leftPrompt);

                    if (rowIdx - 1 < rightValues.size()) {
                        c1.setText((char) ('A' + (rowIdx - 1)) + ") " + rightValues.get(rowIdx - 1));
                    }
                    rowIdx++;
                }

                if (withAnswers) {
                    XWPFParagraph pAns = doc.createParagraph();
                    pAns.setIndentationLeft(360);
                    pAns.setSpacingBefore(60);
                    XWPFRun rAns = pAns.createRun();
                    rAns.setText("Clave de relación correcta:");
                    rAns.setBold(true);
                    rAns.setFontSize(10);
                    rAns.setColor("15803D");

                    int idx = 1;
                    for (Map.Entry<String, String> entry : pairs.entrySet()) {
                        XWPFParagraph pPair = doc.createParagraph();
                        pPair.setIndentationLeft(480);
                        pPair.setSpacingAfter(20);
                        XWPFRun rPair = pPair.createRun();
                        rPair.setText("• " + idx++ + ". \"" + entry.getKey() + "\"  ➔  \"" + entry.getValue() + "\"");
                        rPair.setFontSize(10);
                        rPair.setColor("15803D");
                    }
                }
                break;
            }
            case FILL_BLANKS: {
                String template = qData.get("template") != null ? String.valueOf(qData.get("template")) : prompt;
                List<String> correctBlanks = extractStringList(cData);

                XWPFParagraph fbP = doc.createParagraph();
                fbP.setIndentationLeft(360);
                fbP.setSpacingAfter(40);

                if (!withAnswers) {
                    // Replace [answer] with ___________
                    String rendered = template.replaceAll("\\[[^\\]]+\\]", "___________________");
                    XWPFRun rFb = fbP.createRun();
                    rFb.setText(rendered);
                    rFb.setFontFamily("Calibri");
                    rFb.setFontSize(11);
                } else {
                    XWPFRun rFb = fbP.createRun();
                    rFb.setText(template);
                    rFb.setFontFamily("Calibri");
                    rFb.setFontSize(11);

                    if (!correctBlanks.isEmpty()) {
                        XWPFParagraph pBlanks = doc.createParagraph();
                        pBlanks.setIndentationLeft(360);
                        pBlanks.setSpacingBefore(40);
                        XWPFRun rB = pBlanks.createRun();
                        rB.setText("Palabras clave correctas: " + String.join(", ", correctBlanks));
                        rB.setBold(true);
                        rB.setFontSize(10);
                        rB.setColor("15803D");
                    }
                }
                break;
            }
            case OPEN_TEXT: {
                if (!withAnswers) {
                    for (int l = 0; l < 3; l++) {
                        XWPFParagraph lineP = doc.createParagraph();
                        lineP.setIndentationLeft(360);
                        lineP.setSpacingAfter(20);
                        XWPFRun rLine = lineP.createRun();
                        rLine.setText("__________________________________________________________________________________");
                        rLine.setFontFamily("Calibri");
                        rLine.setFontSize(10);
                        rLine.setColor("94A3B8");
                    }
                } else {
                    XWPFParagraph pAns = doc.createParagraph();
                    pAns.setIndentationLeft(360);
                    pAns.setSpacingBefore(40);
                    XWPFRun rL = pAns.createRun();
                    rL.setText("Respuesta modelo / Criterios de evaluación:");
                    rL.setBold(true);
                    rL.setFontSize(10);
                    rL.setColor("15803D");

                    XWPFParagraph pContent = doc.createParagraph();
                    pContent.setIndentationLeft(480);
                    pContent.setSpacingAfter(40);
                    XWPFRun rC = pContent.createRun();
                    rC.setText(cData != null ? String.valueOf(cData) : "(Sin criterio específico)");
                    rC.setFontSize(10);
                    rC.setItalic(true);
                }
                break;
            }
        }
    }

    // ==========================================
    // 2. GENERATE PDF (.PDF) USING OPENPDF
    // ==========================================
    public byte[] generateExamPdf(Exam exam, boolean withAnswers) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40); // 0.5 in margins
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Add Header & Footer with Page numbers
            writer.setPageEvent(new PdfPageEventHelper() {
                @Override
                public void onEndPage(PdfWriter writer, Document document) {
                    PdfPTable footer = new PdfPTable(1);
                    footer.setTotalWidth(document.right() - document.left());
                    PdfPCell cell = new PdfPCell(new Phrase("Página " + writer.getPageNumber() + (withAnswers ? " | Clave de Respuestas Oficial" : " | Evaluación Colegio Marsella"),
                            FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(148, 163, 184))));
                    cell.setBorder(Rectangle.NO_BORDER);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    footer.addCell(cell);
                    footer.writeSelectedRows(0, -1, document.left(), document.bottom() - 10, writer.getDirectContent());
                }
            });

            document.open();

            // Brand Colors
            Color primaryNavy = new Color(30, 58, 138);       // #1E3A8A
            Color accentYellow = new Color(253, 224, 71);     // #FDE047
            Color greenSuccess = new Color(21, 128, 61);      // #15803D
            Color graySlate = new Color(100, 116, 139);       // #64748B
            Color lightBg = new Color(248, 250, 252);         // #F8FAFC
            Color borderColor = new Color(203, 213, 225);     // #CBD5E1

            // Fonts
            Font fSchool = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Color.WHITE);
            Font fExamTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, accentYellow);
            Font fTeacherKey = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);

            Font fMetaLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);
            Font fMetaValue = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);

            Font fQuestionNum = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, primaryNavy);
            Font fQuestionText = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, Color.BLACK);
            Font fPoints = FontFactory.getFont(FontFactory.HELVETICA, 9, graySlate);

            Font fOptionNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font fOptionCorrect = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, greenSuccess);
            Font fCodeFont = FontFactory.getFont(FontFactory.COURIER, 9, new Color(15, 23, 42));

            // Header Banner Table
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell hCell = new PdfPCell();
            hCell.setBackgroundColor(primaryNavy);
            hCell.setPaddingTop(8);
            hCell.setPaddingBottom(8);
            hCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            hCell.setBorder(Rectangle.NO_BORDER);

            Paragraph pInst = new Paragraph("COLEGIO MARSELLA", fSchool);
            pInst.setAlignment(Element.ALIGN_CENTER);
            hCell.addElement(pInst);

            Paragraph pTitle = new Paragraph(exam.getTitle() != null ? exam.getTitle().toUpperCase() : "EVALUACIÓN ACADÉMICA", fExamTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            hCell.addElement(pTitle);

            if (withAnswers) {
                Paragraph pK = new Paragraph("★ GUÍA OFICIAL Y CLAVE DE RESPUESTAS (USO EXCLUSIVO DEL DOCENTE) ★", fTeacherKey);
                pK.setAlignment(Element.ALIGN_CENTER);
                hCell.addElement(pK);
            }

            headerTable.addCell(hCell);
            document.add(headerTable);

            document.add(new Paragraph(" "));

            // Metadata Grid
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{55f, 45f});

            String gradeGroup = ((exam.getGrade() != null ? exam.getGrade() : "") + " " + (exam.getGroupName() != null ? exam.getGroupName() : "")).trim();
            String blockStr = exam.getBlock() != null ? "Bloque " + exam.getBlock() : "General";
            String teacherName = exam.getTeacher() != null ? (exam.getTeacher().getFullName() != null ? exam.getTeacher().getFullName() : exam.getTeacher().getUsername()) : "Docente";
            String totalPointsStr = (exam.getTotalPoints() != null ? exam.getTotalPoints() : 0.0) + " pts";
            int totalQuestions = exam.getQuestions() != null ? exam.getQuestions().size() : 0;

            addPdfMetaRow(metaTable, "Docente: ", teacherName, "Grado / Grupo: ", gradeGroup.isEmpty() ? "N/A" : gradeGroup, fMetaLabel, fMetaValue, borderColor);
            addPdfMetaRow(metaTable, "Periodo / Bloque: ", blockStr, "Puntaje Máximo: ", totalPointsStr + " (" + totalQuestions + " reactivos)", fMetaLabel, fMetaValue, borderColor);

            if (!withAnswers) {
                addPdfMetaRow(metaTable, "Nombre del Alumno: ", "____________________________________", "Fecha / Calificación: ", "___/___/202__   [ ____ / " + totalPointsStr + " ]", fMetaLabel, fMetaValue, borderColor);
                document.add(metaTable);

                // Instructions Box
                Paragraph pInstBox = new Paragraph();
                pInstBox.setSpacingBefore(8);
                pInstBox.setSpacingAfter(10);
                pInstBox.add(new Chunk("Instrucciones: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f)));
                pInstBox.add(new Chunk(exam.getDescription() != null && !exam.getDescription().isBlank()
                        ? exam.getDescription()
                        : "Lee detenidamente cada reactivo antes de contestar. Responde con claridad y verifica tus respuestas antes de entregar.",
                        FontFactory.getFont(FontFactory.HELVETICA, 9.5f)));
                document.add(pInstBox);
            } else {
                addPdfMetaRow(metaTable, "Código de Acceso: ", exam.getCode() != null ? exam.getCode() : "N/A", "Total de Reactivos: ", String.valueOf(totalQuestions), fMetaLabel, fMetaValue, borderColor);
                document.add(metaTable);

                Paragraph pInstBox = new Paragraph("Nota: Respuestas correctas señaladas en verde y negritas con sus respectivos puntos.",
                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, graySlate));
                pInstBox.setSpacingBefore(6);
                pInstBox.setSpacingAfter(8);
                document.add(pInstBox);
            }

            // Divider Line
            PdfPTable divider = new PdfPTable(1);
            divider.setWidthPercentage(100);
            PdfPCell divCell = new PdfPCell();
            divCell.setBorder(Rectangle.BOTTOM);
            divCell.setBorderColor(primaryNavy);
            divCell.setBorderWidth(1.5f);
            divCell.setFixedHeight(4);
            divider.addCell(divCell);
            document.add(divider);

            document.add(new Paragraph(" "));

            // Render Questions
            List<Question> questions = exam.getQuestions() != null ? exam.getQuestions() : Collections.emptyList();
            for (int i = 0; i < questions.size(); i++) {
                Question q = questions.get(i);
                renderQuestionPdf(document, q, i + 1, withAnswers, fQuestionNum, fQuestionText, fPoints, fOptionNormal, fOptionCorrect, fCodeFont, borderColor);
            }

            // Footer note
            Paragraph pEnd = new Paragraph(withAnswers ? "--- Fin de la Clave de Respuestas ---" : "--- Fin del Examen. ¡Mucho Éxito! ---",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, graySlate));
            pEnd.setAlignment(Element.ALIGN_CENTER);
            pEnd.setSpacingBefore(20);
            document.add(pEnd);

            document.close();
            return out.toByteArray();
        }
    }

    private void renderQuestionPdf(Document document, Question q, int order, boolean withAnswers,
                                   Font fNum, Font fText, Font fPoints, Font fOptNorm, Font fOptCorr, Font fCode, Color borderColor) throws DocumentException {
        double points = q.getPoints() != null ? q.getPoints() : 0.0;
        String prompt = q.getPrompt() != null ? q.getPrompt().trim() : "";

        Paragraph qP = new Paragraph();
        qP.setSpacingBefore(8);
        qP.setSpacingAfter(4);
        qP.add(new Chunk(order + ". ", fNum));
        qP.add(new Chunk(prompt + " ", fText));
        qP.add(new Chunk("(" + points + " pt" + (points == 1.0 ? "" : "s") + ")", fPoints));
        document.add(qP);

        Map<String, Object> qData = parseJsonMap(q.getQuestionData());
        Object cData = parseJsonValue(q.getCorrectAnswer());
        QuestionType type = q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE;

        switch (type) {
            case MULTIPLE_CHOICE: {
                List<String> options = extractOptions(qData);
                List<String> correctOptions = extractStringList(cData);

                char optLetter = 'a';
                for (String opt : options) {
                    boolean isCorrect = withAnswers && isOptionCorrect(opt, correctOptions);
                    Paragraph optP = new Paragraph();
                    optP.setIndentationLeft(20);
                    optP.setSpacingAfter(2);

                    optP.add(new Chunk(optLetter + ") " + opt + (isCorrect ? "  ✓ (CORRECTA)" : ""), isCorrect ? fOptCorr : fOptNorm));
                    document.add(optP);
                    optLetter++;
                }
                break;
            }
            case TRUE_FALSE: {
                boolean correctIsTf = parseBooleanAnswer(cData);

                Paragraph tfP = new Paragraph();
                tfP.setIndentationLeft(20);
                tfP.setSpacingAfter(4);

                boolean vCorrect = withAnswers && correctIsTf;
                boolean fCorrect = withAnswers && !correctIsTf;

                tfP.add(new Chunk((vCorrect ? "( X ) " : "(   ) ") + "Verdadero" + (vCorrect ? "  ✓" : ""), vCorrect ? fOptCorr : fOptNorm));
                tfP.add(new Chunk("        |        ", fOptNorm));
                tfP.add(new Chunk((fCorrect ? "( X ) " : "(   ) ") + "Falso" + (fCorrect ? "  ✓" : ""), fCorrect ? fOptCorr : fOptNorm));
                document.add(tfP);
                break;
            }
            case CODE_BLOCK: {
                String code = qData.get("code") != null ? String.valueOf(qData.get("code")) : "";
                String lang = qData.get("language") != null ? String.valueOf(qData.get("language")).toUpperCase() : "CÓDIGO";

                PdfPTable codeTable = new PdfPTable(1);
                codeTable.setWidthPercentage(95);
                PdfPCell cCell = new PdfPCell();
                cCell.setBackgroundColor(new Color(248, 250, 252));
                cCell.setBorderColor(borderColor);
                cCell.setPadding(6);

                Paragraph pLang = new Paragraph("[" + lang + "]", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(100, 116, 139)));
                cCell.addElement(pLang);

                Paragraph pCode = new Paragraph(code, fCode);
                cCell.addElement(pCode);
                codeTable.addCell(cCell);
                document.add(codeTable);

                List<String> options = extractOptions(qData);
                List<String> correctOptions = extractStringList(cData);

                char optLetter = 'a';
                for (String opt : options) {
                    boolean isCorrect = withAnswers && isOptionCorrect(opt, correctOptions);
                    Paragraph optP = new Paragraph();
                    optP.setIndentationLeft(20);
                    optP.setSpacingBefore(2);
                    optP.setSpacingAfter(2);

                    optP.add(new Chunk(optLetter + ") " + opt + (isCorrect ? "  ✓ (CORRECTA)" : ""), isCorrect ? fOptCorr : fOptNorm));
                    document.add(optP);
                    optLetter++;
                }
                break;
            }
            case RELATE_COLUMNS: {
                Map<String, String> pairs = parsePairs(cData, qData);

                PdfPTable relTable = new PdfPTable(2);
                relTable.setWidthPercentage(95);
                relTable.setSpacingBefore(4);
                relTable.setSpacingAfter(4);

                PdfPCell h0 = new PdfPCell(new Phrase("Columna A (Concepto)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY)));
                PdfPCell h1 = new PdfPCell(new Phrase("Columna B (Definición)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY)));
                h0.setBackgroundColor(new Color(241, 245, 249));
                h1.setBackgroundColor(new Color(241, 245, 249));
                h0.setBorderColor(borderColor);
                h1.setBorderColor(borderColor);
                relTable.addCell(h0);
                relTable.addCell(h1);

                int idx = 1;
                List<String> rightValues = new ArrayList<>(pairs.values());
                if (!withAnswers) {
                    Collections.shuffle(rightValues);
                }

                for (Map.Entry<String, String> entry : pairs.entrySet()) {
                    PdfPCell cellLeft = new PdfPCell(new Phrase("(   )  " + idx + ". " + entry.getKey(), fOptNorm));
                    cellLeft.setBorderColor(borderColor);
                    cellLeft.setPadding(4);

                    String rVal = (idx - 1 < rightValues.size()) ? (char) ('A' + (idx - 1)) + ") " + rightValues.get(idx - 1) : "";
                    PdfPCell cellRight = new PdfPCell(new Phrase(rVal, fOptNorm));
                    cellRight.setBorderColor(borderColor);
                    cellRight.setPadding(4);

                    relTable.addCell(cellLeft);
                    relTable.addCell(cellRight);
                    idx++;
                }
                document.add(relTable);

                if (withAnswers) {
                    Paragraph pK = new Paragraph("Relación correcta:", fOptCorr);
                    pK.setIndentationLeft(20);
                    document.add(pK);

                    int pIdx = 1;
                    for (Map.Entry<String, String> entry : pairs.entrySet()) {
                        Paragraph pP = new Paragraph("• " + pIdx++ + ". \"" + entry.getKey() + "\"  ➔  \"" + entry.getValue() + "\"", fOptCorr);
                        pP.setIndentationLeft(30);
                        document.add(pP);
                    }
                }
                break;
            }
            case FILL_BLANKS: {
                String template = qData.get("template") != null ? String.valueOf(qData.get("template")) : prompt;
                List<String> correctBlanks = extractStringList(cData);

                Paragraph fbP = new Paragraph();
                fbP.setIndentationLeft(20);
                fbP.setSpacingAfter(4);

                if (!withAnswers) {
                    String rendered = template.replaceAll("\\[[^\\]]+\\]", "___________________");
                    fbP.add(new Chunk(rendered, fOptNorm));
                    document.add(fbP);
                } else {
                    fbP.add(new Chunk(template, fOptNorm));
                    document.add(fbP);

                    if (!correctBlanks.isEmpty()) {
                        Paragraph pB = new Paragraph("Palabras clave correctas: " + String.join(", ", correctBlanks), fOptCorr);
                        pB.setIndentationLeft(20);
                        document.add(pB);
                    }
                }
                break;
            }
            case OPEN_TEXT: {
                if (!withAnswers) {
                    for (int l = 0; l < 3; l++) {
                        Paragraph lineP = new Paragraph("____________________________________________________________________________________",
                                FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(148, 163, 184)));
                        lineP.setIndentationLeft(20);
                        lineP.setSpacingAfter(3);
                        document.add(lineP);
                    }
                } else {
                    Paragraph pAns = new Paragraph("Respuesta modelo / Criterio: " + (cData != null ? String.valueOf(cData) : "(Sin criterio específico)"),
                            FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9.5f, fOptCorr.getColor()));
                    pAns.setIndentationLeft(20);
                    pAns.setSpacingAfter(4);
                    document.add(pAns);
                }
                break;
            }
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    private void setTableBorders(XWPFTable table) {
        table.setTopBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "CBD5E1");
        table.setBottomBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "CBD5E1");
        table.setLeftBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "CBD5E1");
        table.setRightBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "CBD5E1");
        table.setInsideHBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "E2E8F0");
        table.setInsideVBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, "E2E8F0");
    }

    private void fillMetaCell(XWPFTableCell cell, String label, String value) {
        cell.setColor("F8FAFC");
        XWPFParagraph p = cell.getParagraphs().get(0);
        p.setSpacingBefore(40);
        p.setSpacingAfter(40);

        XWPFRun rLabel = p.createRun();
        rLabel.setText(label + " ");
        rLabel.setBold(true);
        rLabel.setFontSize(9.5);
        rLabel.setFontFamily("Calibri");

        XWPFRun rVal = p.createRun();
        rVal.setText(value);
        rVal.setFontSize(9.5);
        rVal.setFontFamily("Calibri");
    }

    private void addPdfMetaRow(PdfPTable table, String l1, String v1, String l2, String v2, Font fLabel, Font fValue, Color borderColor) {
        PdfPCell c1 = new PdfPCell();
        c1.setBorderColor(borderColor);
        c1.setBackgroundColor(new Color(248, 250, 252));
        c1.setPadding(4);
        Paragraph p1 = new Paragraph();
        p1.add(new Chunk(l1, fLabel));
        p1.add(new Chunk(v1, fValue));
        c1.addElement(p1);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell();
        c2.setBorderColor(borderColor);
        c2.setBackgroundColor(new Color(248, 250, 252));
        c2.setPadding(4);
        Paragraph p2 = new Paragraph();
        p2.add(new Chunk(l2, fLabel));
        p2.add(new Chunk(v2, fValue));
        c2.addElement(p2);
        table.addCell(c2);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private Object parseJsonValue(String json) {
        if (json == null || json.isBlank()) return "";
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> extractOptions(Map<String, Object> qData) {
        if (qData == null) return Collections.emptyList();
        Object raw = qData.get("options");
        if (raw instanceof List<?>) {
            List<String> res = new ArrayList<>();
            for (Object item : (List<?>) raw) {
                if (item != null) res.add(String.valueOf(item));
            }
            return res;
        }
        return Collections.emptyList();
    }

    private List<String> extractStringList(Object value) {
        if (value == null) return Collections.emptyList();
        if (value instanceof List<?>) {
            List<String> res = new ArrayList<>();
            for (Object item : (List<?>) value) {
                if (item != null) res.add(String.valueOf(item).trim());
            }
            return res;
        }
        return Collections.singletonList(String.valueOf(value).trim());
    }

    private boolean isOptionCorrect(String option, List<String> correctOptions) {
        if (option == null || correctOptions == null) return false;
        String trimmed = option.trim();
        for (String c : correctOptions) {
            if (trimmed.equalsIgnoreCase(c.trim())) return true;
        }
        return false;
    }

    private boolean parseBooleanAnswer(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean) return (Boolean) value;
        String s = String.valueOf(value).trim().toLowerCase();
        return s.equals("true") || s.equals("verdadero") || s.equals("v") || s.equals("1");
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parsePairs(Object cData, Map<String, Object> qData) {
        Map<String, String> result = new LinkedHashMap<>();
        if (cData instanceof Map<?, ?>) {
            for (Map.Entry<?, ?> e : ((Map<?, ?>) cData).entrySet()) {
                if (e.getKey() != null && e.getValue() != null) {
                    result.put(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                }
            }
        }
        if (result.isEmpty() && qData != null && qData.containsKey("pairs")) {
            Object raw = qData.get("pairs");
            if (raw instanceof List<?>) {
                for (Object item : (List<?>) raw) {
                    if (item instanceof Map<?, ?>) {
                        Map<?, ?> m = (Map<?, ?>) item;
                        Object l = m.get("left");
                        Object r = m.get("right");
                        if (l != null && r != null) {
                            result.put(String.valueOf(l), String.valueOf(r));
                        }
                    }
                }
            }
        }
        return result;
    }
}
