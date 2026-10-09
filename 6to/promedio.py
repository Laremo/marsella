examen = 40
tareas = 25
trabajos = 25
asistencia = 10

calificacion_examen = input("Cuanto saco en el examen?")
calificacion_tareas = input("Cuanto saco en tareas? ")
calificacion_trabajos = input("Cuanto saco en trabajos")
calificacion_asistencia = input("Cuanto saco en asistencia?")

print(f"Calificacion examen: {calificacion_examen}")
print(f"Calificacion tareas: {calificacion_tareas}")
print(f"Calificacion trabajos: {calificacion_trabajos}")
print(f"Calificacion asistancia: {calificacion_asistencia}")

def calcular_calificacion(porcentaje, calificacion_maxima, calificacion_alumno):
    calificacion_salida = 0
    calificacion_salida = int(calificacion_alumno) * porcentaje / calificacion_maxima /10

    return calificacion_salida

calificacion_examen_final = calcular_calificacion(examen, 10, calificacion_examen)
calificacion_tareas_final = calcular_calificacion(tareas, 10, calificacion_tareas)
calificacion_trabajos_final = calcular_calificacion(trabajos, 10, calificacion_trabajos)
calificacion_asistencia_final = calcular_calificacion(asistencia, 10, calificacion_asistencia)

print(f"Examen: {calificacion_examen_final}")
print(f"Tareas: {calificacion_tareas_final}")
print(f"Trabajos: {calificacion_trabajos_final}")
print(f"Asistencia: {calificacion_asistencia_final}")

final = calificacion_examen_final + calificacion_tareas_final + calificacion_asistencia_final + calificacion_trabajos_final

print(f"Calificacion final {final}")    