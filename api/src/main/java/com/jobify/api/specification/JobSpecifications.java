package com.jobify.api.specification;

import com.jobify.api.entity.ContractType;
import com.jobify.api.entity.Job;
import com.jobify.api.entity.JobSnapshot;
import com.jobify.api.entity.RemoteType;
import com.jobify.api.entity.Skill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public final class JobSpecifications {

    private JobSpecifications() {}

    public static Specification<Job> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    public static Specification<Job> inSector(UUID sectorId) {
        return (root, query, cb) -> cb.equal(root.get("sector").get("id"), sectorId);
    }

    public static Specification<Job> hasAnySkill(List<UUID> skillIds) {
        return (root, query, cb) -> {
            Subquery<UUID> sub = query.subquery(UUID.class);
            Root<Job> subJob = sub.from(Job.class);
            Join<Job, Skill> skills = subJob.join("skills");
            sub.select(subJob.get("id")).where(skills.get("id").in(skillIds));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Job> withSeniority(String seniority) {
        return (root, query, cb) -> {
            Subquery<UUID> sub = query.subquery(UUID.class);
            Root<JobSnapshot> snap = sub.from(JobSnapshot.class);
            sub.select(snap.get("job").get("id"))
               .where(cb.equal(snap.get("seniority"), seniority));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Job> withContractType(String contractTypeValue) {
        ContractType type = Arrays.stream(ContractType.values())
                .filter(t -> t.value.equals(contractTypeValue))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "contractType inválido: " + contractTypeValue));
        return (root, query, cb) -> {
            Subquery<UUID> sub = query.subquery(UUID.class);
            Root<JobSnapshot> snap = sub.from(JobSnapshot.class);
            sub.select(snap.get("job").get("id"))
               .where(cb.equal(snap.get("contractType"), type));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Job> withRemoteType(String remoteTypeValue) {
        RemoteType type = Arrays.stream(RemoteType.values())
                .filter(t -> t.value.equals(remoteTypeValue))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "remoteType inválido: " + remoteTypeValue));
        return (root, query, cb) -> {
            Subquery<UUID> sub = query.subquery(UUID.class);
            Root<JobSnapshot> snap = sub.from(JobSnapshot.class);
            sub.select(snap.get("job").get("id"))
               .where(cb.equal(snap.get("remoteType"), type));
            return root.get("id").in(sub);
        };
    }

    public static Specification<Job> inDistrict(String district) {
        return (root, query, cb) -> cb.equal(root.get("district"), district);
    }
}
