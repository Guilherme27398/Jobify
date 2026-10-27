package com.jobify.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record JobDto(
        UUID id,
        String title,
        CompanySummaryDto company,
        SectorDto sector,
        String location,
        String district,
        String url,
        String source,
        String contractType,
        String remoteType,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        String salaryCurrency,
        String salaryPeriod,
        List<SkillSummaryDto> skills,
        OffsetDateTime firstSeenAt,
        OffsetDateTime lastSeenAt
) {}
