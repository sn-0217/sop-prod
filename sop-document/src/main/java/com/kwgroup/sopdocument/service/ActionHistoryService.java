package com.kwgroup.sopdocument.service;

import com.kwgroup.sopdocument.model.ActionHistory;
import com.kwgroup.sopdocument.model.ActionType;
import com.kwgroup.sopdocument.model.SopEntry;
import com.kwgroup.sopdocument.repository.ActionHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionHistoryService {

    private final ActionHistoryRepository actionHistoryRepository;

    /**
     * Log an action to history.
     * 
     * @param actionType Type of action
     * @param sop        The SOP entry (can be null for deleted SOPs)
     * @param actorName  Who performed the action
     * @param comments   Optional comments
     */
    @Async
    public void logAction(ActionType actionType, SopEntry sop, String actorName, String comments) {
        try {
            ActionHistory history = ActionHistory.builder()
                    .actionType(actionType)
                    .sopId(sop != null ? sop.getId() : null)
                    .sopFileName(sop != null ? sop.getFileName() : null)
                    .sopBrand(sop != null ? sop.getBrand() : null)
                    .sopCategory(sop != null ? sop.getFileCategory() : null)
                    .actorName(actorName)
                    .comments(comments)
                    .build();

            actionHistoryRepository.save(history);
            log.debug("Logged action: {} for SOP: {} by: {}", actionType,
                    sop != null ? sop.getFileName() : "N/A", actorName);
        } catch (Exception e) {
            log.error("Failed to log action: {}", actionType, e);
            // Don't throw exception - logging failure shouldn't break main flow
        }
    }

    /**
     * Log an action with SOP details (for deleted SOPs where entity is gone).
     */
    @Async
    public void logAction(ActionType actionType, String sopId, String fileName, String brand,
            String category, String actorName, String comments) {
        try {
            ActionHistory history = ActionHistory.builder()
                    .actionType(actionType)
                    .sopId(sopId)
                    .sopFileName(fileName)
                    .sopBrand(brand)
                    .sopCategory(category)
                    .actorName(actorName)
                    .comments(comments)
                    .build();

            actionHistoryRepository.save(history);
            log.debug("Logged action: {} for SOP: {} by: {}", actionType, fileName, actorName);
        } catch (Exception e) {
            log.error("Failed to log action: {}", actionType, e);
        }
    }

    /**
     * Log an action with pending operation link.
     * 
     * @param actionType         Type of action
     * @param sopId              SOP ID (can be null for uploads not yet created)
     * @param pendingOperationId ID of the pending operation this action relates to
     * @param actorName          Who performed the action
     * @param comments           Optional comments
     */
    @Async
    public void logActionWithOperation(ActionType actionType, String sopId, String pendingOperationId,
            String actorName, String comments) {
        logActionWithOperation(actionType, sopId, pendingOperationId, null, null, null, actorName, comments);
    }

    /**
     * Log an action with pending operation link and SOP details.
     * Use this overload when SOP details are available (e.g., from proposedData for
     * uploads).
     * 
     * @param actionType         Type of action
     * @param sopId              SOP ID (can be null for uploads not yet created)
     * @param pendingOperationId ID of the pending operation this action relates to
     * @param fileName           SOP file name
     * @param brand              SOP brand
     * @param category           SOP category
     * @param actorName          Who performed the action
     * @param comments           Optional comments
     */
    @Async
    public void logActionWithOperation(ActionType actionType, String sopId, String pendingOperationId,
            String fileName, String brand, String category, String actorName, String comments) {
        try {
            ActionHistory history = ActionHistory.builder()
                    .actionType(actionType)
                    .sopId(sopId)
                    .sopFileName(fileName)
                    .sopBrand(brand)
                    .sopCategory(category)
                    .pendingOperationId(pendingOperationId)
                    .actorName(actorName)
                    .comments(comments)
                    .build();

            actionHistoryRepository.save(history);
            log.debug("Logged action: {} for operation: {} by: {}", actionType, pendingOperationId, actorName);
        } catch (Exception e) {
            log.error("Failed to log action: {}", actionType, e);
        }
    }
}
