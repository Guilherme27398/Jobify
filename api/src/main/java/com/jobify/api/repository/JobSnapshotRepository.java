package com.jobify.api.repository;

import com.jobify.api.entity.JobSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface JobSnapshotRepository extends JpaRepository<JobSnapshot, UUID> {

    List<JobSnapshot> findByJob_IdOrderByRecordedAtDesc(UUID jobId);

    List<JobSnapshot> findByJob_IdInOrderByRecordedAtDesc(Collection<UUID> jobIds);

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

    /*
     * Média mensal dos salários comparáveis, em euros brutos ANUAIS: os mensais contam × 14
     * (12 meses + subsídios de férias e de Natal). Cada vaga entra uma vez por mês (o snapshot
     * mais recente) e só entram salários com período conhecido.
     */
    @Query(value = """
            SELECT month, AVG(annual_min) AS avg_min, AVG(annual_max) AS avg_max
            FROM (
                SELECT DISTINCT ON (s.job_id, date_trunc('month', s.recorded_at))
                       to_char(date_trunc('month', s.recorded_at), 'YYYY-MM') AS month,
                       s.salary_min * CASE s.salary_period WHEN 'month' THEN 14 ELSE 1 END AS annual_min,
                       COALESCE(s.salary_max, s.salary_min)
                           * CASE s.salary_period WHEN 'month' THEN 14 ELSE 1 END AS annual_max
                FROM job_snapshots s
                JOIN jobs j ON j.id = s.job_id
                WHERE j.sector_id = :sectorId AND j.is_active = true
                  AND s.salary_min IS NOT NULL AND s.salary_period IS NOT NULL
                ORDER BY s.job_id, date_trunc('month', s.recorded_at), s.recorded_at DESC
            ) per_job
            GROUP BY month
            ORDER BY month
            """, nativeQuery = true)
    List<Object[]> salaryEvolutionPerMonth(UUID sectorId);

    @Query(value = """
            SELECT COALESCE(
                count(CASE WHEN s.salary_min IS NOT NULL AND s.salary_period IS NOT NULL THEN 1 END) * 1.0 / NULLIF(count(*), 0),
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
