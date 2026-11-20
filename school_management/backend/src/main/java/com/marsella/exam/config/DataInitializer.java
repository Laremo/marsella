package com.marsella.exam.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.model.*;
import com.marsella.exam.repository.ExamRepository;
import com.marsella.exam.repository.QuizRepository;
import com.marsella.exam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final QuizRepository quizRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        // Seed default professor if none exists
        User defaultTeacher = userRepository.findByUsername("admin").orElseGet(() -> {
            log.info("Seeding default professor account: admin / admin123");
            User user = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Profesor Administrador")
                    .email("admin@marsella.edu")
                    .role("ROLE_TEACHER")
                    .build();
            return userRepository.save(user);
        });

        // Seed default director if none exists
        userRepository.findByUsername("directivo").orElseGet(() -> {
            log.info("Seeding default director account: directivo / directivo123");
            User user = User.builder()
                    .username("directivo")
                    .password(passwordEncoder.encode("directivo123"))
                    .fullName("Dirección Escolar")
                    .email("direccion@marsella.edu")
                    .role("ROLE_DIRECTOR")
                    .build();
            return userRepository.save(user);
        });

        // Seed default student demo user if none exists
        userRepository.findByUsername("alumno").orElseGet(() -> {
            log.info("Seeding default student account: alumno / alumno123");
            User user = User.builder()
                    .username("alumno")
                    .password(passwordEncoder.encode("alumno123"))
                    .fullName("Alumno Ejemplo")
                    .email("alumno@marsella.edu")
                    .role("ROLE_STUDENT")
                    .build();
            return userRepository.save(user);
        });

        // Seed a demo exam if no exams exist yet
        if (examRepository.count() == 0) {
            log.info("Seeding sample demonstration exam: DEMO-2026");
            try {
                Exam demoExam = Exam.builder()
                        .code("DEMO-2026")
                        .title("Examen de Demostración - Cultura General y Ciencia")
                        .description("Examen de prueba que incluye los 4 tipos de preguntas: Opción múltiple, Verdadero/Falso, Relacionar columnas y Completar espacios.")
                        .grade("2do")
                        .groupName("A")
                        .block(2)
                        .teacher(defaultTeacher)
                        .startDate(LocalDateTime.now().minusHours(1))
                        .endDate(LocalDateTime.now().plusDays(30))
                        .isActive(true)
                        .totalPoints(10.0)
                        .build();

                List<Question> questions = new ArrayList<>();

                // 1. Multiple Choice
                Map<String, Object> mcData = new HashMap<>();
                mcData.put("options", Arrays.asList("Núcleo", "Mitocondria", "Ribosoma", "Retículo endoplasmático"));
                mcData.put("allowMultiple", false);

                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(1)
                        .prompt("¿Cuál de los siguientes organelos celulares es conocido como la central de energía celular?")
                        .type(QuestionType.MULTIPLE_CHOICE)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(mcData))
                        .correctAnswer(objectMapper.writeValueAsString(Collections.singletonList("Mitocondria")))
                        .build());

                // 2. True / False
                Map<String, Object> tfData = new HashMap<>();
                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(2)
                        .prompt("El océano Pacífico es el océano más extenso y profundo de la Tierra.")
                        .type(QuestionType.TRUE_FALSE)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(tfData))
                        .correctAnswer(objectMapper.writeValueAsString(true))
                        .build());

                // 3. Relate Columns
                Map<String, Object> rcData = new HashMap<>();
                rcData.put("leftColumn", Arrays.asList("Francia", "Japón", "México", "Canadá"));
                rcData.put("rightColumn", Arrays.asList("Tokio", "París", "Ottawa", "Ciudad de México")); // Will be shuffled for students

                Map<String, String> rcMatches = new HashMap<>();
                rcMatches.put("Francia", "París");
                rcMatches.put("Japón", "Tokio");
                rcMatches.put("México", "Ciudad de México");
                rcMatches.put("Canadá", "Ottawa");

                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(3)
                        .prompt("Relaciona cada país con su respectiva capital:")
                        .type(QuestionType.RELATE_COLUMNS)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(rcData))
                        .correctAnswer(objectMapper.writeValueAsString(rcMatches))
                        .build());

                // 4. Fill in the blanks
                Map<String, Object> fbData = new HashMap<>();
                // Blanks indicated by [word]
                fbData.put("template", "El punto de ebullición del agua al nivel del mar es de [100] grados Celsius y su fórmula química es [H2O].");

                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(4)
                        .prompt("Completa la oración con las palabras o valores numéricos correctos:")
                        .type(QuestionType.FILL_BLANKS)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(fbData))
                        .correctAnswer(objectMapper.writeValueAsString(Arrays.asList("100", "H2O")))
                        .build());

                Map<String, Object> openData = new HashMap<>();
                openData.put("type", "OPEN_TEXT");

                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(5)
                        .prompt("Explica brevemente con tus propias palabras qué importancia tuvo la caída de Constantinopla en el comercio de la época:")
                        .type(QuestionType.OPEN_TEXT)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(openData))
                        .correctAnswer(objectMapper.writeValueAsString("rutas comerciales"))
                        .build());

                // 6. Code Block Question
                Map<String, Object> codeData = new HashMap<>();
                codeData.put("code", "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(4))");
                codeData.put("language", "python");
                codeData.put("options", Arrays.asList("24", "16", "10", "4"));
                codeData.put("allowMultiple", false);

                questions.add(Question.builder()
                        .exam(demoExam)
                        .questionOrder(6)
                        .prompt("Analiza el siguiente algoritmo recursivo en Python. ¿Cuál es el valor que imprimirá en consola?")
                        .type(QuestionType.CODE_BLOCK)
                        .points(2.5)
                        .questionData(objectMapper.writeValueAsString(codeData))
                        .correctAnswer(objectMapper.writeValueAsString(Collections.singletonList("24")))
                        .build());

                demoExam.setQuestions(questions);
                demoExam.setTotalPoints(15.0);
                examRepository.save(demoExam);
                log.info("Demo exam DEMO-2026 seeded successfully!");
            } catch (Exception e) {
                log.error("Failed to seed demo exam", e);
            }
        }

        // Seed demo Quiz for user laremo (or fallback defaultTeacher) if no quizzes exist
        if (quizRepository.count() == 0) {
            User quizTeacher = userRepository.findByUsername("laremo").orElse(defaultTeacher);
            log.info("Seeding demo quiz for user '{}'", quizTeacher.getUsername());
            try {
                Quiz demoQuiz = Quiz.builder()
                        .title("Quiz de Demostración - Cultura Digital y Tecnología")
                        .description("Quiz interactivo en vivo para poner a prueba conocimientos de tecnología, redes y cultura digital.")
                        .defaultTimeLimitSeconds(15)
                        .basePoints(1000)
                        .teacher(quizTeacher)
                        .createdAt(LocalDateTime.now())
                        .build();

                List<QuizQuestion> qList = new ArrayList<>();

                // Question 1
                List<Map<String, Object>> opt1 = List.of(
                        Map.of("id", "A", "text", "HTTP", "color", "RED", "shape", "TRIANGLE", "isCorrect", false),
                        Map.of("id", "B", "text", "HTTPS", "color", "BLUE", "shape", "DIAMOND", "isCorrect", true),
                        Map.of("id", "C", "text", "FTP", "color", "YELLOW", "shape", "CIRCLE", "isCorrect", false),
                        Map.of("id", "D", "text", "SMTP", "color", "GREEN", "shape", "SQUARE", "isCorrect", false)
                );
                qList.add(QuizQuestion.builder()
                        .quiz(demoQuiz)
                        .questionOrder(1)
                        .prompt("¿Qué protocolo se utiliza comúnmente para navegar de forma segura y cifrada en la web?")
                        .timeLimitSeconds(15)
                        .points(1000)
                        .optionsJson(objectMapper.writeValueAsString(opt1))
                        .explanation("HTTPS cifra la comunicación punto a punto utilizando certificados SSL/TLS.")
                        .build());

                // Question 2
                List<Map<String, Object>> opt2 = List.of(
                        Map.of("id", "A", "text", "Disco de Estado Sólido (SSD)", "color", "RED", "shape", "TRIANGLE", "isCorrect", false),
                        Map.of("id", "B", "text", "Memoria RAM", "color", "BLUE", "shape", "DIAMOND", "isCorrect", false),
                        Map.of("id", "C", "text", "Procesador (CPU)", "color", "YELLOW", "shape", "CIRCLE", "isCorrect", true),
                        Map.of("id", "D", "text", "Tarjeta Gráfica (GPU)", "color", "GREEN", "shape", "SQUARE", "isCorrect", false)
                );
                qList.add(QuizQuestion.builder()
                        .quiz(demoQuiz)
                        .questionOrder(2)
                        .prompt("¿Cuál de los siguientes componentes es considerado el 'cerebro' principal de una computadora?")
                        .timeLimitSeconds(15)
                        .points(1000)
                        .optionsJson(objectMapper.writeValueAsString(opt2))
                        .explanation("La CPU (Unidad Central de Procesamiento) ejecuta todas las instrucciones fundamentales del sistema.")
                        .build());

                // Question 3
                List<Map<String, Object>> opt3 = List.of(
                        Map.of("id", "A", "text", "Cola (Queue)", "color", "RED", "shape", "TRIANGLE", "isCorrect", false),
                        Map.of("id", "B", "text", "Pila (Stack)", "color", "BLUE", "shape", "DIAMOND", "isCorrect", true),
                        Map.of("id", "C", "text", "Árbol Binario", "color", "YELLOW", "shape", "CIRCLE", "isCorrect", false),
                        Map.of("id", "D", "text", "Grafo", "color", "GREEN", "shape", "SQUARE", "isCorrect", false)
                );
                qList.add(QuizQuestion.builder()
                        .quiz(demoQuiz)
                        .questionOrder(3)
                        .prompt("¿Qué estructura de datos opera bajo el principio LIFO (Last In, First Out)?")
                        .timeLimitSeconds(15)
                        .points(1000)
                        .optionsJson(objectMapper.writeValueAsString(opt3))
                        .explanation("En una Pila (Stack), el último elemento añadido es el primero en ser retirado.")
                        .build());

                // Question 4
                List<Map<String, Object>> opt4 = List.of(
                        Map.of("id", "A", "text", "1989", "color", "RED", "shape", "TRIANGLE", "isCorrect", true),
                        Map.of("id", "B", "text", "1995", "color", "BLUE", "shape", "DIAMOND", "isCorrect", false),
                        Map.of("id", "C", "text", "2001", "color", "YELLOW", "shape", "CIRCLE", "isCorrect", false),
                        Map.of("id", "D", "text", "1975", "color", "GREEN", "shape", "SQUARE", "isCorrect", false)
                );
                qList.add(QuizQuestion.builder()
                        .quiz(demoQuiz)
                        .questionOrder(4)
                        .prompt("¿En qué año propuso Tim Berners-Lee la World Wide Web en el CERN?")
                        .timeLimitSeconds(15)
                        .points(1000)
                        .optionsJson(objectMapper.writeValueAsString(opt4))
                        .explanation("Tim Berners-Lee escribió la primera propuesta de la WWW en marzo de 1989.")
                        .build());

                // Question 5
                List<Map<String, Object>> opt5 = List.of(
                        Map.of("id", "A", "text", "3306", "color", "RED", "shape", "TRIANGLE", "isCorrect", false),
                        Map.of("id", "B", "text", "8080", "color", "BLUE", "shape", "DIAMOND", "isCorrect", false),
                        Map.of("id", "C", "text", "5432", "color", "YELLOW", "shape", "CIRCLE", "isCorrect", true),
                        Map.of("id", "D", "text", "27017", "color", "GREEN", "shape", "SQUARE", "isCorrect", false)
                );
                qList.add(QuizQuestion.builder()
                        .quiz(demoQuiz)
                        .questionOrder(5)
                        .prompt("¿Cuál es el puerto de red por defecto para conexiones a una base de datos PostgreSQL?")
                        .timeLimitSeconds(15)
                        .points(1000)
                        .optionsJson(objectMapper.writeValueAsString(opt5))
                        .explanation("El puerto oficial estándar registrado para PostgreSQL es el 5432.")
                        .build());

                demoQuiz.setQuestions(qList);
                quizRepository.save(demoQuiz);
                log.info("Demo quiz seeded successfully with 5 questions!");
            } catch (Exception e) {
                log.error("Failed to seed demo quiz", e);
            }
        }
    }
}
