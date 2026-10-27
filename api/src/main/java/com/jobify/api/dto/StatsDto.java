package com.jobify.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record StatsDto(
        long activeJobs,
        List<MonthCount> jobsOverTime,
        List<MonthlySalary> salaryEvolution,
        double salaryCoverage,
        List<DistrictCount> districtDistribution,
        List<NamedCount> topSkills,
        List<NamedCount> topCompanies,
        List<NamedCount> remoteTypes
) {
    public record MonthCount(String month, long count) {}
    /** Médias em euros brutos ANUAIS (salários mensais × 14). */
    public record MonthlySalary(String month, BigDecimal avgMin, BigDecimal avgMax) {}
    public record DistrictCount(String district, long count) {}
    /** Contagem por nome: competência, empresa ou modalidade ('remote', 'hybrid', 'on_site', 'unknown'). */
    public record NamedCount(String name, long count) {}
}
