package com.jobify.api.repository;

import com.jobify.api.entity.Sector;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SectorRepository extends JpaRepository<Sector, UUID> {

    Optional<Sector> findBySlug(String slug);
}
