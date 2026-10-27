package com.jobify.api.repository;

import com.jobify.api.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
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

    @Query("SELECT DISTINCT j.district FROM Job j WHERE j.active = true AND j.district IS NOT NULL ORDER BY j.district")
    List<String> findDistinctActiveDistricts();

    long countByActiveTrue();

    long countBySector_IdAndActiveTrue(UUID sectorId);

    @Query(value = """
            SELECT sk.name, count(*) AS cnt
            FROM job_skills js
            JOIN jobs j ON j.id = js.job_id
            JOIN skills sk ON sk.id = js.skill_id
            WHERE j.sector_id = :sectorId AND j.is_active = true
            GROUP BY sk.name
            ORDER BY cnt DESC, sk.name
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topSkills(UUID sectorId, int limit);

    @Query(value = """
            SELECT c.name, count(*) AS cnt
            FROM jobs j
            JOIN companies c ON c.id = j.company_id
            WHERE j.sector_id = :sectorId AND j.is_active = true
            GROUP BY c.name
            ORDER BY cnt DESC, c.name
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> topCompanies(UUID sectorId, int limit);

    /* Modalidade de cada vaga ativa segundo o snapshot mais recente; sem indicação conta como 'unknown'. */
    @Query(value = """
            SELECT COALESCE(CAST(latest.remote_type AS text), 'unknown') AS remote, count(*) AS cnt
            FROM jobs j
            LEFT JOIN LATERAL (
                SELECT s.remote_type
                FROM job_snapshots s
                WHERE s.job_id = j.id
                ORDER BY s.recorded_at DESC
                LIMIT 1
            ) latest ON true
            WHERE j.sector_id = :sectorId AND j.is_active = true
            GROUP BY 1
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> remoteTypeDistribution(UUID sectorId);

    @Query("SELECT COUNT(DISTINCT j.company.id) FROM Job j WHERE j.active = true AND j.company IS NOT NULL")
    long countActiveCompanies();

    @Query("SELECT COUNT(j) FROM Job j WHERE j.active = true AND j.firstSeenAt >= :since")
    long countNewSince(OffsetDateTime since);

    @Query("SELECT MAX(j.lastSeenAt) FROM Job j WHERE j.active = true")
    OffsetDateTime findLastSeenAt();
}
