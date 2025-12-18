package com.kwgroup.sopdocument.repository;

import com.kwgroup.sopdocument.model.ActionHistory;
import com.kwgroup.sopdocument.model.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActionHistoryRepository extends JpaRepository<ActionHistory, String> {

    List<ActionHistory> findBySopIdOrderByTimestampDesc(String sopId);

    List<ActionHistory> findByActionTypeOrderByTimestampDesc(ActionType actionType);

    List<ActionHistory> findTop100ByOrderByTimestampDesc();
}
