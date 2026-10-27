package com.jobify.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_snapshots")
public class JobSnapshot {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "scrape_run_id")
    private UUID scrapeRunId;

    private String seniority;
    private ContractType contractType;
    private RemoteType remoteType;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String salaryCurrency;
    private OffsetDateTime recordedAt;

    protected JobSnapshot() {}

    public UUID getId()                  { return id; }
    public Job getJob()                  { return job; }
    public UUID getScrapeRunId()         { return scrapeRunId; }
    public String getSeniority()         { return seniority; }
    public ContractType getContractType() { return contractType; }
    public RemoteType getRemoteType()    { return remoteType; }
    public BigDecimal getSalaryMin()     { return salaryMin; }
    public BigDecimal getSalaryMax()     { return salaryMax; }
    public String getSalaryCurrency()    { return salaryCurrency; }
    public OffsetDateTime getRecordedAt() { return recordedAt; }
}
