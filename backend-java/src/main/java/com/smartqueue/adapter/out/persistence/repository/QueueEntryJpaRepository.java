package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.QueueEntryJpaEntity;
import com.smartqueue.domain.QueueStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QueueEntryJpaRepository extends JpaRepository<QueueEntryJpaEntity, String> {

    Optional<QueueEntryJpaEntity> findFirstByShopIdAndStatusOrderByPositionAscJoinedAtAsc(
            String shopId, QueueStatus status);

    List<QueueEntryJpaEntity> findByShopIdAndStatusOrderByPositionAscJoinedAtAsc(
            String shopId, QueueStatus status);

    Optional<QueueEntryJpaEntity> findFirstByServedByAndStatus(String servedBy, QueueStatus status);

    /**
     * See {@link com.smartqueue.application.port.out.QueueEntryRepository#lockNextWaiting}. A
     * derived-name method can't carry {@code @Lock} under a distinct name from the unlocked
     * lookup above without also renaming its OrderBy clause in confusing ways, so this one is
     * spelled out as JPQL instead, called with a single-row {@link Pageable}.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select e from QueueEntryJpaEntity e
            where e.shopId = :shopId and e.status = :status
            order by e.position asc, e.joinedAt asc
            """)
    List<QueueEntryJpaEntity> lockFirstByShopIdAndStatus(
            @Param("shopId") String shopId, @Param("status") QueueStatus status, Pageable pageable);

    /** shop_id+token is unique ({@code uq_queue_entries_shop_token}), so no ordering is needed. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<QueueEntryJpaEntity> findByShopIdAndTokenAndStatus(String shopId, int token, QueueStatus status);

    Optional<QueueEntryJpaEntity> findFirstByPhoneAndStatusInOrderByJoinedAtDesc(
            String phone, Collection<QueueStatus> statuses);

    int countByShopIdAndStatusAndPositionLessThan(String shopId, QueueStatus status, int position);

    @Query("select max(e.token) from QueueEntryJpaEntity e where e.shopId = :shopId and e.tokenCycle = :tokenCycle")
    Optional<Integer> findHighestToken(@Param("shopId") String shopId, @Param("tokenCycle") int tokenCycle);

    @Query("""
            select max(e.position) from QueueEntryJpaEntity e
            where e.shopId = :shopId and e.status in :statuses
            """)
    Optional<Integer> findHighestPosition(
            @Param("shopId") String shopId, @Param("statuses") Collection<QueueStatus> statuses);
}
