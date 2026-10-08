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
    calificacion_salida = int(calificacion_alumno) * porcentaje / calificacion_maxima

    print(f"Calificacion {calificacion_salida}")

calcular_calificacion(examen, 10, calificacion_examen)