package com.jobify.api.service;

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
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StatsService {

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

        return new StatsDto(jobsOverTime, salaryEvolution, salaryCoverage, districtDistribution);
    }
}
