package com.jobify.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record StatsDto(
        List<MonthCount> jobsOverTime,
        List<MonthlySalary> salaryEvolution,
        double salaryCoverage,
        List<DistrictCount> districtDistribution
) {
    public record MonthCount(String month, long count) {}
    public record MonthlySalary(String month, BigDecimal avgMin, BigDecimal avgMax) {}
    public record DistrictCount(String district, long count) {}
}
