package com.jobify.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private Sector sector;

    private String externalId;
    private String source;
    private String title;
    private String description;
    private String location;
    private String district;
    private String url;

    @Column(name = "is_active")
    private boolean active;

    private short consecutiveMisses;
    private OffsetDateTime firstSeenAt;
    private OffsetDateTime lastSeenAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @BatchSize(size = 50)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "job_skills",
        joinColumns = @JoinColumn(name = "job_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills;

    protected Job() {}

    public UUID getId()                  { return id; }
    public Company getCompany()          { return company; }
    public Sector getSector()            { return sector; }
    public String getExternalId()        { return externalId; }
    public String getSource()            { return source; }
    public String getTitle()             { return title; }
    public String getDescription()       { return description; }
    public String getLocation()          { return location; }
    public String getDistrict()          { return district; }
    public String getUrl()               { return url; }
    public boolean isActive()            { return active; }
    public short getConsecutiveMisses()  { return consecutiveMisses; }
    public OffsetDateTime getFirstSeenAt() { return firstSeenAt; }
    public OffsetDateTime getLastSeenAt()  { return lastSeenAt; }
    public OffsetDateTime getCreatedAt()   { return createdAt; }
    public OffsetDateTime getUpdatedAt()   { return updatedAt; }
    public Set<Skill> getSkills()        { return skills; }
}
