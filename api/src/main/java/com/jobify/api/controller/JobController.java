package com.jobify.api.controller;

import com.jobify.api.dto.JobDto;
import com.jobify.api.dto.PageResponse;
import com.jobify.api.service.JobService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public PageResponse<JobDto> list(
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) List<UUID> skillId,
            @RequestParam(required = false) String seniority,
            @RequestParam(required = false) String contractType,
            @RequestParam(required = false) String remoteType,
            @RequestParam(required = false) String district,
            @PageableDefault(size = 20, sort = "lastSeenAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return jobService.findAll(sector, skillId, seniority, contractType, remoteType, district, pageable);
    }
}
