package com.jobify.api.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    private UUID id;
    private String name;
    private String linkedinUrl;
    private String location;
    private String logoUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    protected Company() {}

    public UUID getId()               { return id; }
    public String getName()           { return name; }
    public String getLinkedinUrl()    { return linkedinUrl; }
    public String getLocation()       { return location; }
    public String getLogoUrl()        { return logoUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
