package com.jobify.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// DB_URL/DB_USER/DB_PASSWORD são substituídos pelo @ServiceConnection do Testcontainers;
// os valores aqui servem apenas para satisfazer os placeholders do application.yml.
@SpringBootTest(properties = {"DB_URL=tc", "DB_USER=tc", "DB_PASSWORD=tc"})
@AutoConfigureMockMvc
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    protected MockMvc mvc;
}
