package com.jobify.api.controller;

import com.jobify.api.dto.FiltersDto;
import com.jobify.api.dto.SectorDto;
import com.jobify.api.service.SectorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sectors")
public class SectorController {

    private final SectorService sectorService;

    public SectorController(SectorService sectorService) {
        this.sectorService = sectorService;
    }

    @GetMapping
    public List<SectorDto> list() {
        return sectorService.findAll();
    }

    @GetMapping("/{slug}/filters")
    public FiltersDto filters(@PathVariable String slug) {
        return sectorService.findFilters(slug);
    }
}
