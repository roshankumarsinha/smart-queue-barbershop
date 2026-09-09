package com.smartqueue.adapter.out.persistence;

import com.smartqueue.adapter.out.persistence.repository.QueueEntryJpaRepository;
import com.smartqueue.application.port.out.QueueEntryRepository;
import com.smartqueue.domain.QueueStatus;
import com.smartqueue.domain.model.QueueEntry;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class QueueEntryPersistenceAdapter implements QueueEntryRepository {

    private final QueueEntryJpaRepository entries;

    QueueEntryPersistenceAdapter(QueueEntryJpaRepository entries) {
        this.entries = entries;
    }

    @Override
    public Optional<QueueEntry> findById(String entryId) {
        return entries.findById(entryId).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<QueueEntry> findFirstByStatus(String shopId, QueueStatus status) {
        return entries
                .findFirstByShopIdAndStatusOrderByPositionAscJoinedAtAsc(shopId, status)
                .map(PersistenceMapper::toDomain);
    }

    @Override
    public List<QueueEntry> findAllByStatus(String shopId, QueueStatus status) {
        return entries.findByShopIdAndStatusOrderByPositionAscJoinedAtAsc(shopId, status).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<QueueEntry> findActiveByServedBy(String staffId) {
        return entries.findFirstByServedByAndStatus(staffId, QueueStatus.IN_SERVICE).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<QueueEntry> lockNextWaiting(String shopId) {
        return entries.lockFirstByShopIdAndStatus(shopId, QueueStatus.WAITING, PageRequest.of(0, 1)).stream()
                .findFirst()
                .map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<QueueEntry> lockWaitingByToken(String shopId, int token) {
        return entries.findByShopIdAndTokenAndStatus(shopId, token, QueueStatus.WAITING)
                .map(PersistenceMapper::toDomain);
    }

    @Override
    public List<QueueEntry> findWaitingOrdered(String shopId) {
        return entries.findByShopIdAndStatusOrderByPositionAscJoinedAtAsc(shopId, QueueStatus.WAITING).stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<QueueEntry> findActiveByPhone(String phone) {
        return entries.findFirstByPhoneAndStatusInOrderByJoinedAtDesc(phone, QueueStatus.ACTIVE)
                .map(PersistenceMapper::toDomain);
    }

    @Override
    public int countWaitingAhead(String shopId, int position) {
        return entries.countByShopIdAndStatusAndPositionLessThan(shopId, QueueStatus.WAITING, position);
    }

    @Override
    public Optional<Integer> highestToken(String shopId, int tokenCycle) {
        return entries.findHighestToken(shopId, tokenCycle);
    }

    @Override
    public Optional<Integer> highestActivePosition(String shopId) {
        return entries.findHighestPosition(shopId, QueueStatus.ACTIVE);
    }

    /**
     * Flushes on purpose. Ids are assigned before the insert, so Spring Data merges
     * rather than persists, and @CreationTimestamp / @UpdateTimestamp would otherwise
     * only be populated at commit — long after the caller has mapped the result and
     * broadcast it. Flushing makes the returned entry tell the truth.
     */
    @Override
    public QueueEntry save(QueueEntry entry) {
        return PersistenceMapper.toDomain(entries.saveAndFlush(PersistenceMapper.toEntity(entry)));
    }
}
