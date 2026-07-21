package com.jobify.api.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {

    @Id
    private UUID id;
    private String name;
    private SkillType skillType;
    private OffsetDateTime createdAt;

    protected Skill() {}

    public UUID getId()               { return id; }
    public String getName()           { return name; }
    public SkillType getSkillType()   { return skillType; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
