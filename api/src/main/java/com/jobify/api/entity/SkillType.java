package com.jobify.api.entity;

public enum SkillType {
    TECHNICAL("technical"),
    LEGAL("legal"),
    LANGUAGE("language"),
    CERTIFICATION("certification"),
    SOFT_SKILL("soft_skill"),
    OTHER("other");

    public final String value;

    SkillType(String value) { this.value = value; }
}
