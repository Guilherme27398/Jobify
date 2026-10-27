package com.jobify.api.controller;

import com.jobify.api.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.jdbc.Sql;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Sql({"/sql/truncate-tables.sql", "/sql/insert-test-data.sql"})
class StatsControllerTest extends AbstractIntegrationTest {

    @Test
    void stats_returnsJobsOverTime() throws Exception {
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobsOverTime", hasSize(2)));
    }

    @Test
    void stats_salaryCoverageIsHalf() throws Exception {
        // 2 snapshots: 1 com salário, 1 sem → cobertura = 0.5
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salaryCoverage").value(0.5));
    }

    @Test
    void stats_salaryEvolutionOnlyIncludesMonthsWithSalary() throws Exception {
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salaryEvolution", hasSize(1)));
    }

    @Test
    void stats_salaryEvolutionIsAnnualGross() throws Exception {
        // 3.000–4.500 €/mês × 14 = 42.000–63.000 € brutos por ano
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salaryEvolution[0].avgMin").value(42000.0))
                .andExpect(jsonPath("$.salaryEvolution[0].avgMax").value(63000.0));
    }

    @Test
    void stats_districtDistributionReflectsActiveJobs() throws Exception {
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.districtDistribution", hasSize(1)))
                .andExpect(jsonPath("$.districtDistribution[0].district").value("Lisboa"))
                .andExpect(jsonPath("$.districtDistribution[0].count").value(1));
    }

    @Test
    void stats_activeJobsCountsOnlyActiveJobs() throws Exception {
        // tecnologia tem 1 vaga ativa e 1 inativa
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeJobs").value(1));
    }

    @Test
    void stats_topSkillsAndCompaniesOfActiveJobs() throws Exception {
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topSkills", hasSize(1)))
                .andExpect(jsonPath("$.topSkills[0].name").value("Java"))
                .andExpect(jsonPath("$.topSkills[0].count").value(1))
                .andExpect(jsonPath("$.topCompanies[0].name").value("Acme Corp"))
                .andExpect(jsonPath("$.topCompanies[0].count").value(1));
    }

    @Test
    void stats_remoteTypesUseLatestSnapshot() throws Exception {
        mvc.perform(get("/stats/tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remoteTypes", hasSize(1)))
                .andExpect(jsonPath("$.remoteTypes[0].name").value("hybrid"))
                .andExpect(jsonPath("$.remoteTypes[0].count").value(1));
    }

    @Test
    void stats_remoteTypesCountJobsWithoutSnapshotAsUnknown() throws Exception {
        // a vaga de advocacia não tem snapshots
        mvc.perform(get("/stats/advocacia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remoteTypes[0].name").value("unknown"))
                .andExpect(jsonPath("$.remoteTypes[0].count").value(1));
    }

    @Test
    void stats_unknownSlug_returns404() throws Exception {
        mvc.perform(get("/stats/inexistente"))
                .andExpect(status().isNotFound());
    }
}
