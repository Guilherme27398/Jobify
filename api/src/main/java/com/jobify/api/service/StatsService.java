package com.jobify.api.service;

import com.jobify.api.dto.HomeStatsDto;
import com.jobify.api.dto.StatsDto;
import com.jobify.api.entity.Sector;
import com.jobify.api.repository.JobRepository;
import com.jobify.api.repository.JobSnapshotRepository;
import com.jobify.api.repository.SectorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private static final int TOP_SKILLS = 10;
    private static final int TOP_COMPANIES = 8;

    private final SectorRepository sectorRepository;
    private final JobRepository jobRepository;
    private final JobSnapshotRepository jobSnapshotRepository;

    public StatsService(SectorRepository sectorRepository,
                        JobRepository jobRepository,
                        JobSnapshotRepository jobSnapshotRepository) {
        this.sectorRepository = sectorRepository;
        this.jobRepository = jobRepository;
        this.jobSnapshotRepository = jobSnapshotRepository;
    }

    public HomeStatsDto getHomeStats() {
        OffsetDateTime weekAgo = OffsetDateTime.now().minusDays(7);
        return new HomeStatsDto(
                jobRepository.countByActiveTrue(),
                jobRepository.countActiveCompanies(),
                jobRepository.countNewSince(weekAgo),
                jobRepository.findLastSeenAt());
    }

    public StatsDto getStats(String slug) {
        Sector sector = sectorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sector não encontrado: " + slug));

        List<StatsDto.MonthCount> jobsOverTime = jobSnapshotRepository
                .countJobsPerMonth(sector.getId()).stream()
                .map(row -> new StatsDto.MonthCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();

        List<StatsDto.MonthlySalary> salaryEvolution = jobSnapshotRepository
                .salaryEvolutionPerMonth(sector.getId()).stream()
                .map(row -> new StatsDto.MonthlySalary(
                        (String) row[0],
                        row[1] == null ? null : new BigDecimal(row[1].toString()),
                        row[2] == null ? null : new BigDecimal(row[2].toString())))
                .toList();

        Double coverage = jobSnapshotRepository.salaryCoverage(sector.getId());
        double salaryCoverage = coverage != null ? coverage : 0.0;

        List<StatsDto.DistrictCount> districtDistribution = jobRepository
                .districtDistribution(sector.getId()).stream()
                .map(row -> new StatsDto.DistrictCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();

        UUID sectorId = sector.getId();
        return new StatsDto(
                jobRepository.countBySector_IdAndActiveTrue(sectorId),
                jobsOverTime,
                salaryEvolution,
                salaryCoverage,
                districtDistribution,
                toNamedCounts(jobRepository.topSkills(sectorId, TOP_SKILLS)),
                toNamedCounts(jobRepository.topCompanies(sectorId, TOP_COMPANIES)),
                toNamedCounts(jobRepository.remoteTypeDistribution(sectorId)));
    }

    private static List<StatsDto.NamedCount> toNamedCounts(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new StatsDto.NamedCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }
}
