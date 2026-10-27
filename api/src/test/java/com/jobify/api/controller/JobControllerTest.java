package com.jobify.api.controller;

import com.jobify.api.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.jdbc.Sql;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Sql({"/sql/truncate-tables.sql", "/sql/insert-test-data.sql"})
class JobControllerTest extends AbstractIntegrationTest {

    @Test
    void listJobs_excludesInactiveByDefault() throws Exception {
        mvc.perform(get("/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].title", not(hasItem("Python Dev (inactive)"))));
    }

    @Test
    void listJobs_filterBySector() throws Exception {
        mvc.perform(get("/jobs").param("sector", "tecnologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Java Developer"));
    }

    @Test
    void listJobs_filterByContractType() throws Exception {
        mvc.perform(get("/jobs").param("sector", "tecnologia").param("contractType", "full_time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listJobs_filterByRemoteType() throws Exception {
        mvc.perform(get("/jobs").param("sector", "tecnologia").param("remoteType", "hybrid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listJobs_filterByDistrict() throws Exception {
        mvc.perform(get("/jobs").param("district", "Lisboa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listJobs_unknownSector_returns404() throws Exception {
        mvc.perform(get("/jobs").param("sector", "inexistente"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listJobs_invalidContractType_returns400() throws Exception {
        mvc.perform(get("/jobs").param("contractType", "invalido"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listJobs_paginationDefaults() throws Exception {
        mvc.perform(get("/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20));
    }
}
