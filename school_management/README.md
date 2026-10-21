# Plataforma de Exámenes Escolares - Marsella

Sistema web interactivo para creación, aplicación y evaluación automática de exámenes dentro de una red local (LAN) o en la nube, construido con **Spring Boot**, **PostgreSQL**, **React (Material-UI)** y completamente **dockerizado**.

---

## 🌟 Características Principales

### 1. 📝 4 Tipos de Preguntas con Calificación Automática
- **Opción Múltiple (`MULTIPLE_CHOICE`)**: Soporte para selección simple o múltiple con puntaje asignable por pregunta.
- **Verdadero / Falso (`TRUE_FALSE`)**: Tarjetas interactivas de selección rápida.
- **Relacionar Columnas (`RELATE_COLUMNS`)**: Vinculación interactiva columna A con columna B (soporta pantallas táctiles y ratón con puntaje parcial proporcional).
- **Completar Espacios en Blanco (`FILL_BLANKS`)**: Textos con campos editables en línea `[palabra]`, con evaluación sensible o normalizada.

### 2. 🛡️ Resiliencia ante Desconexiones (Auto-guardado y Reanudación)
- Los estudiantes **no requieren registrar cuenta**. Solo ingresan su **código de examen** y su **nombre completo**.
- Si un alumno sufre una desconexión de red o cierra el navegador accidentalmente, al ingresar nuevamente con su código y nombre **recupera exactamente sus respuestas guardadas y continúa el examen**.
- Guardado automático en segundo plano en tiempo real.

### 3. ⏰ Control de Fechas y Edición de Exámenes
- Cada examen cuenta con **fecha/hora de inicio** y **fecha/hora de fin**.
- **Regla de integridad**: Un examen **solo puede ser editado antes de su fecha de inicio**. Una vez iniciado o finalizado, queda protegido y bloqueado contra modificaciones accidentales.

### 4. 👨‍🏫 Panel de Profesores y Calificaciones
- Autenticación segura mediante **JWT (JSON Web Tokens)**.
- Cuenta de profesor predeterminada lista para usar:
  - **Usuario**: `admin`
  - **Contraseña**: `admin123`
  - *(También permite registrar nuevas cuentas de maestros directamente desde el portal).*
- Métricas en tiempo real: número de entregas, calificaciones calculadas al instante, porcentajes de aciertos y desglose detallado de respuestas pregunta por pregunta.

### 5. 🌐 Conexión en Red Local (LAN)
- Dockerizado con **Nginx** como reverse proxy en el puerto `80`.
- Los alumnos en la misma red Wi-Fi o Ethernet pueden conectarse abriendo `http://<IP_DEL_PROFESOR>` en cualquier teléfono, tablet o laptop.

---

## 🛠️ Arquitectura Tecnológica

| Componente | Tecnología |
| :--- | :--- |
| **Base de Datos** | PostgreSQL 16 (con persistencia en volumen Docker) |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, JJWT |
| **Frontend** | React 18, Vite, Material-UI (MUI v5), Emotion, Day.js, Canvas-Confetti |
| **Orquestación** | Docker & Docker Compose con builds multi-etapa optimizados |

---

## 🚀 Puesta en Marcha Rápida (Docker)

### Prerrequisitos
- Tener instalado **Docker** y **Docker Compose** en la computadora del profesor/servidor.

### 1. Iniciar los contenedores
Abre una terminal en la carpeta `general` y ejecuta:

```bash
cd general
docker compose up --build -d
```

Docker descargará y construirá automáticamente:
1. `marsella_exam_postgres` (PostgreSQL 16)
2. `marsella_exam_backend` (Spring Boot API en puerto 8080)
3. `marsella_exam_frontend` (React + Nginx en puerto 80 y 3000)

### 2. Verificar el estado
```bash
docker compose ps
```

---

## 💻 Acceso al Sistema

### Para el Profesor (en la misma máquina):
- Abre tu navegador en: [http://localhost](http://localhost) o [http://localhost/teacher/login](http://localhost/teacher/login)
- Inicia sesión con:
  - **Usuario:** `admin`
  - **Contraseña:** `admin123`

### Para los Alumnos (en la Red Local LAN):
1. Averigua la dirección IP de la computadora del profesor:
   - En Windows (PowerShell): `ipconfig` (busca la *IPv4*, ej: `192.168.1.75`)
   - En Linux / macOS: `ip a` o `ifconfig`
2. Los alumnos se conectan a esa misma red Wi-Fi y entran desde su navegador a:
   ```
   http://192.168.1.75
   ```
3. Ingresan el código del examen (ej: `DEMO-2026`) y su nombre completo.

---

## 🧪 Examen de Demostración Incluido

El sistema incluye automáticamente un examen de demostración creado al arrancar:
- **Código:** `DEMO-2026`
- **Título:** *Examen de Demostración - Cultura General y Ciencia*
- **Contenido:** Contiene ejemplos funcionales de los 4 tipos de preguntas (Opción múltiple, Verdadero/Falso, Relacionar columnas y Completar espacios).
- **Puntos:** 10.0 pts.

---

## 🛑 Detener el Sistema

Para detener los contenedores:
```bash
docker compose down
```

Para detener y borrar la base de datos (reinicio limpio):
```bash
docker compose down -v
```
