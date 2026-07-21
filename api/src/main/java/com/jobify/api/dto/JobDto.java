package com.jobify.api.dto;

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
        List<SkillSummaryDto> skills,
        OffsetDateTime lastSeenAt
) {}
