package com.jobify.api.dto;

import java.time.OffsetDateTime;

/** Números da homepage: calculados sobre vagas ativas de todos os setores. */
public record HomeStatsDto(
        long activeJobs,
        long companies,
        long newThisWeek,
        OffsetDateTime lastUpdatedAt
) {}
