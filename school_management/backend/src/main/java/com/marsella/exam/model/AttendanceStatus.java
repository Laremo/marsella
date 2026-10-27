package com.marsella.exam.model;

public enum AttendanceStatus {
    PRESENT("Asistencia"),
    ABSENT("Falta"),
    LATE("Retardo"),
    JUSTIFIED("Justificada");

    private final String label;

    AttendanceStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
