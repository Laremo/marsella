package com.marsella.exam.model;

public enum IncidentSeverity {
    LEVE("Leve"),
    MODERADA("Moderada"),
    GRAVE("Grave");

    private final String label;

    IncidentSeverity(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
