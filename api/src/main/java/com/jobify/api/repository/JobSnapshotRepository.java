package com.jobify.api.repository;

import com.jobify.api.entity.JobSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface JobSnapshotRepository extends JpaRepository<JobSnapshot, UUID> {

    List<JobSnapshot> findByJob_IdOrderByRecordedAtDesc(UUID jobId);

    @Query(value = """
            SELECT to_char(date_trunc('month', s.recorded_at), 'YYYY-MM') AS month,
                   count(DISTINCT s.job_id) AS count
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true
            GROUP BY date_trunc('month', s.recorded_at)
            ORDER BY 1
            """, nativeQuery = true)
    List<Object[]> countJobsPerMonth(UUID sectorId);

    @Query(value = """
            SELECT to_char(date_trunc('month', s.recorded_at), 'YYYY-MM') AS month,
                   AVG(s.salary_min) AS avg_min,
                   AVG(s.salary_max) AS avg_max
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true AND s.salary_min IS NOT NULL
            GROUP BY date_trunc('month', s.recorded_at)
            ORDER BY 1
            """, nativeQuery = true)
    List<Object[]> salaryEvolutionPerMonth(UUID sectorId);

    @Query(value = """
            SELECT COALESCE(
                count(CASE WHEN s.salary_min IS NOT NULL THEN 1 END) * 1.0 / NULLIF(count(*), 0),
                0
            )
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true
            """, nativeQuery = true)
    Double salaryCoverage(UUID sectorId);

    @Query(value = """
            SELECT DISTINCT s.seniority
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true AND s.seniority IS NOT NULL
            ORDER BY 1
            """, nativeQuery = true)
    List<String> findDistinctSenioritiesBySector(UUID sectorId);

    @Query(value = """
            SELECT DISTINCT s.contract_type
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true AND s.contract_type IS NOT NULL
            ORDER BY 1
            """, nativeQuery = true)
    List<String> findDistinctContractTypesBySector(UUID sectorId);

    @Query(value = """
            SELECT DISTINCT s.remote_type
            FROM job_snapshots s
            JOIN jobs j ON j.id = s.job_id
            WHERE j.sector_id = :sectorId AND j.is_active = true AND s.remote_type IS NOT NULL
            ORDER BY 1
            """, nativeQuery = true)
    List<String> findDistinctRemoteTypesBySector(UUID sectorId);
}
