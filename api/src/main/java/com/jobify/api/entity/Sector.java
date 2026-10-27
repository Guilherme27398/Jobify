package com.jobify.api.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sectors")
public class Sector {

    @Id
    private UUID id;
    private String name;
    private String slug;
    private OffsetDateTime createdAt;

    protected Sector() {}

    public UUID getId()               { return id; }
    public String getName()           { return name; }
    public String getSlug()           { return slug; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
