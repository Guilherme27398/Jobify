package com.jobify.api.repository;

import com.jobify.api.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    @Override
    @EntityGraph(attributePaths = {"company", "sector"})
    Page<Job> findAll(Specification<Job> spec, Pageable pageable);

    @Query(value = """
            SELECT j.district, count(*) AS cnt
            FROM jobs j
            WHERE j.sector_id = :sectorId AND j.is_active = true AND j.district IS NOT NULL
            GROUP BY j.district
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> districtDistribution(UUID sectorId);

    @Query("SELECT DISTINCT j.district FROM Job j WHERE j.sector.id = :sectorId AND j.active = true AND j.district IS NOT NULL ORDER BY j.district")
    List<String> findDistinctDistrictsBySector(UUID sectorId);
}
