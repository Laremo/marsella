package com.marsella.exam.model;

public enum ActivityType {
    TAREA("Tarea"),
    TRABAJO_CLASE("Trabajo en Clase"),
    PROYECTO("Proyecto"),
    PARTICIPACION("Participación"),
    PUNTOS_EXTRA("Puntos Extra");

    private final String label;

    ActivityType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
