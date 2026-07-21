package com.jobify.api.controller;

import com.jobify.api.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.jdbc.Sql;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Sql({"/sql/truncate-tables.sql", "/sql/insert-test-data.sql"})
class SectorControllerTest extends AbstractIntegrationTest {

    @Test
    void listSectors_returnsAllSectors() throws Exception {
        mvc.perform(get("/sectors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].slug", hasItem("tecnologia")))
                .andExpect(jsonPath("$[*].slug", hasItem("advocacia")));
    }

    @Test
    void filters_returnsFilterValuesForSector() throws Exception {
        mvc.perform(get("/sectors/tecnologia/filters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[*].name", hasItem("Java")))
                .andExpect(jsonPath("$.seniorities", hasItem("senior")))
                .andExpect(jsonPath("$.contractTypes", hasItem("full_time")))
                .andExpect(jsonPath("$.remoteTypes", hasItem("hybrid")))
                .andExpect(jsonPath("$.districts", hasItem("Lisboa")));
    }

    @Test
    void filters_unknownSlug_returns404() throws Exception {
        mvc.perform(get("/sectors/inexistente/filters"))
                .andExpect(status().isNotFound());
    }
}
