package com.marsella.exam.model;

public enum PeriodType {
    BLOQUE("Bloques", 5),
    TRIMESTRE("Trimestres", 3),
    BIMESTRE("Bimestres", 5),
    SEMESTRE("Semestres", 2),
    CUATRIMESTRE("Cuatrimestres", 3),
    ANUAL("Anual", 1),
    PERSONALIZADO("Personalizado", 1);

    private final String label;
    private final int defaultCount;

    PeriodType(String label, int defaultCount) {
        this.label = label;
        this.defaultCount = defaultCount;
    }

    public String getLabel() {
        return label;
    }

    public int getDefaultCount() {
        return defaultCount;
    }
}
