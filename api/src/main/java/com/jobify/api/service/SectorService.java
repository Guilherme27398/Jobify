package com.jobify.api.service;

import com.jobify.api.dto.FiltersDto;
import com.jobify.api.dto.SectorDto;
import com.jobify.api.dto.SkillSummaryDto;
import com.jobify.api.entity.Sector;
import com.jobify.api.repository.JobRepository;
import com.jobify.api.repository.JobSnapshotRepository;
import com.jobify.api.repository.SectorRepository;
import com.jobify.api.repository.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SectorService {

    private final SectorRepository sectorRepository;
    private final SkillRepository skillRepository;
    private final JobRepository jobRepository;
    private final JobSnapshotRepository jobSnapshotRepository;

    public SectorService(SectorRepository sectorRepository,
                         SkillRepository skillRepository,
                         JobRepository jobRepository,
                         JobSnapshotRepository jobSnapshotRepository) {
        this.sectorRepository = sectorRepository;
        this.skillRepository = skillRepository;
        this.jobRepository = jobRepository;
        this.jobSnapshotRepository = jobSnapshotRepository;
    }

    public List<SectorDto> findAll() {
        return sectorRepository.findAll().stream()
                .map(s -> new SectorDto(s.getId(), s.getName(), s.getSlug()))
                .toList();
    }

    public FiltersDto findFilters(String slug) {
        Sector sector = sectorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sector não encontrado: " + slug));

        List<SkillSummaryDto> skills = skillRepository.findActiveBySectorId(sector.getId()).stream()
                .map(s -> new SkillSummaryDto(s.getId(), s.getName(), s.getSkillType().value))
                .toList();

        return new FiltersDto(
                skills,
                jobSnapshotRepository.findDistinctSenioritiesBySector(sector.getId()),
                jobSnapshotRepository.findDistinctContractTypesBySector(sector.getId()),
                jobSnapshotRepository.findDistinctRemoteTypesBySector(sector.getId()),
                jobRepository.findDistinctDistrictsBySector(sector.getId())
        );
    }
}
