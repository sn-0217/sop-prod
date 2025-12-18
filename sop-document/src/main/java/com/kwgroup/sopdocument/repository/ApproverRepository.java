package com.kwgroup.sopdocument.repository;

import com.kwgroup.sopdocument.model.Approver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApproverRepository extends JpaRepository<Approver, String> {

    Optional<Approver> findByUsername(String username);

    List<Approver> findByActiveTrue();
}
