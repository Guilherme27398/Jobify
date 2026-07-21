package com.jobify.api.service;

import com.jobify.api.dto.CompanySummaryDto;
import com.jobify.api.dto.JobDto;
import com.jobify.api.dto.PageResponse;
import com.jobify.api.dto.SectorDto;
import com.jobify.api.dto.SkillSummaryDto;
import com.jobify.api.entity.Job;
import com.jobify.api.entity.Sector;
import com.jobify.api.repository.JobRepository;
import com.jobify.api.repository.SectorRepository;
import com.jobify.api.specification.JobSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final SectorRepository sectorRepository;

    public JobService(JobRepository jobRepository, SectorRepository sectorRepository) {
        this.jobRepository = jobRepository;
        this.sectorRepository = sectorRepository;
    }

    public PageResponse<JobDto> findAll(String sectorSlug,
                                        List<UUID> skillIds,
                                        String seniority,
                                        String contractType,
                                        String remoteType,
                                        String district,
                                        Pageable pageable) {
        Specification<Job> spec = Specification.where(JobSpecifications.isActive());

        if (sectorSlug != null) {
            Sector sector = sectorRepository.findBySlug(sectorSlug)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sector não encontrado: " + sectorSlug));
            spec = spec.and(JobSpecifications.inSector(sector.getId()));
        }
        if (skillIds != null && !skillIds.isEmpty()) {
            spec = spec.and(JobSpecifications.hasAnySkill(skillIds));
        }
        if (seniority != null) {
            spec = spec.and(JobSpecifications.withSeniority(seniority));
        }
        if (contractType != null) {
            spec = spec.and(JobSpecifications.withContractType(contractType));
        }
        if (remoteType != null) {
            spec = spec.and(JobSpecifications.withRemoteType(remoteType));
        }
        if (district != null) {
            spec = spec.and(JobSpecifications.inDistrict(district));
        }

        Page<Job> page = jobRepository.findAll(spec, pageable);

        List<JobDto> content = page.getContent().stream()
                .map(this::toDto)
                .toList();

        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    private JobDto toDto(Job job) {
        CompanySummaryDto company = job.getCompany() == null ? null
                : new CompanySummaryDto(job.getCompany().getName(), job.getCompany().getLogoUrl());

        SectorDto sector = new SectorDto(
                job.getSector().getId(),
                job.getSector().getName(),
                job.getSector().getSlug());

        List<SkillSummaryDto> skills = job.getSkills().stream()
                .map(s -> new SkillSummaryDto(s.getId(), s.getName(), s.getSkillType().value))
                .toList();

        return new JobDto(job.getId(), job.getTitle(), company, sector,
                job.getLocation(), job.getDistrict(), job.getUrl(), skills, job.getLastSeenAt());
    }
}
