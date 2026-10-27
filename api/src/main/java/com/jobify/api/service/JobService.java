package com.jobify.api.service;

import com.jobify.api.dto.CompanySummaryDto;
import com.jobify.api.dto.JobDto;
import com.jobify.api.dto.PageResponse;
import com.jobify.api.dto.SectorDto;
import com.jobify.api.dto.SkillSummaryDto;
import com.jobify.api.entity.Job;
import com.jobify.api.entity.JobSnapshot;
import com.jobify.api.entity.Sector;
import com.jobify.api.repository.JobRepository;
import com.jobify.api.repository.JobSnapshotRepository;
import com.jobify.api.repository.SectorRepository;
import com.jobify.api.specification.JobSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final SectorRepository sectorRepository;
    private final JobSnapshotRepository jobSnapshotRepository;

    public JobService(JobRepository jobRepository,
                      SectorRepository sectorRepository,
                      JobSnapshotRepository jobSnapshotRepository) {
        this.jobRepository = jobRepository;
        this.sectorRepository = sectorRepository;
        this.jobSnapshotRepository = jobSnapshotRepository;
    }

    public PageResponse<JobDto> findAll(String q,
                                        String sectorSlug,
                                        List<UUID> skillIds,
                                        String seniority,
                                        String contractType,
                                        String remoteType,
                                        String district,
                                        Pageable pageable) {
        Specification<Job> spec = Specification.where(JobSpecifications.isActive());

        if (q != null && !q.isBlank()) {
            spec = spec.and(JobSpecifications.titleContains(q.trim()));
        }
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
        Map<UUID, JobSnapshot> latest = latestSnapshots(page.getContent());

        List<JobDto> content = page.getContent().stream()
                .map(job -> toDto(job, latest.get(job.getId())))
                .toList();

        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    /** Distritos com vagas ativas, de todos os setores (para "Todas as áreas"). */
    public List<String> findDistricts() {
        return jobRepository.findDistinctActiveDistricts();
    }

    /* Um único pedido para os snapshots da página, em vez de um por vaga. */
    private Map<UUID, JobSnapshot> latestSnapshots(List<Job> jobs) {
        if (jobs.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = jobs.stream().map(Job::getId).toList();
        Map<UUID, JobSnapshot> latest = new HashMap<>();
        for (JobSnapshot snapshot : jobSnapshotRepository.findByJob_IdInOrderByRecordedAtDesc(ids)) {
            latest.putIfAbsent(snapshot.getJob().getId(), snapshot);
        }
        return latest;
    }

    private JobDto toDto(Job job, JobSnapshot snapshot) {
        CompanySummaryDto company = job.getCompany() == null ? null
                : new CompanySummaryDto(job.getCompany().getName(), job.getCompany().getLogoUrl());

        SectorDto sector = new SectorDto(
                job.getSector().getId(),
                job.getSector().getName(),
                job.getSector().getSlug());

        List<SkillSummaryDto> skills = job.getSkills().stream()
                .map(s -> new SkillSummaryDto(s.getId(), s.getName(), s.getSkillType().value))
                .toList();

        return new JobDto(
                job.getId(),
                job.getTitle(),
                company,
                sector,
                job.getLocation(),
                job.getDistrict(),
                job.getUrl(),
                job.getSource(),
                snapshot == null || snapshot.getContractType() == null ? null : snapshot.getContractType().value,
                snapshot == null || snapshot.getRemoteType() == null ? null : snapshot.getRemoteType().value,
                snapshot == null ? null : snapshot.getSalaryMin(),
                snapshot == null ? null : snapshot.getSalaryMax(),
                snapshot == null ? null : snapshot.getSalaryCurrency(),
                snapshot == null ? null : snapshot.getSalaryPeriod(),
                skills,
                job.getFirstSeenAt(),
                job.getLastSeenAt());
    }
}
