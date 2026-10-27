package com.jobify.api.controller;

import com.jobify.api.dto.StatsDto;
import com.jobify.api.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/{slug}")
    public StatsDto stats(@PathVariable String slug) {
        return statsService.getStats(slug);
    }
}
