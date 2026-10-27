package com.marsella.exam.model;

public enum IncidentType {
    LLAMADO_ATENCION("Llamado de Atención"),
    REPORTE_CONDUCTA("Reporte de Conducta"),
    MERITO("Reconocimiento / Mérito"),
    OBSERVACION("Observación");

    private final String label;

    IncidentType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
