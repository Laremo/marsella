package com.marsella.exam.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.Question;
import com.marsella.exam.model.QuestionType;
import com.marsella.exam.model.User;
import com.marsella.exam.repository.ExamRepository;
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
    }
}
