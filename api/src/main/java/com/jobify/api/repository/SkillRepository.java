package com.jobify.api.repository;

import com.jobify.api.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    @Query("SELECT DISTINCT s FROM Job j JOIN j.skills s WHERE j.sector.id = :sectorId AND j.active = true ORDER BY s.name")
    List<Skill> findActiveBySectorId(UUID sectorId);
}
