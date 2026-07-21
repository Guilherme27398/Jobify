package com.jobify.api.dto;

import java.util.List;

public record FiltersDto(
        List<SkillSummaryDto> skills,
        List<String> seniorities,
        List<String> contractTypes,
        List<String> remoteTypes,
        List<String> districts
) {}
