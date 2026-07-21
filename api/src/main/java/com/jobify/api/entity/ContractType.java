package com.jobify.api.entity;

public enum ContractType {
    FULL_TIME("full_time"),
    PART_TIME("part_time"),
    INTERNSHIP("internship"),
    FREELANCE("freelance"),
    TEMPORARY("temporary");

    public final String value;

    ContractType(String value) { this.value = value; }
}
