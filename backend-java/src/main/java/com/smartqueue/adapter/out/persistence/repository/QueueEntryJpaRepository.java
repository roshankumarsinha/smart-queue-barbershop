package com.smartqueue.adapter.out.persistence.repository;

import com.smartqueue.adapter.out.persistence.entity.QueueEntryJpaEntity;
import com.smartqueue.domain.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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

    int countByShopIdAndStatusInAndPositionLessThan(
            String shopId, Collection<QueueStatus> statuses, int position);

    @Query("select max(e.token) from QueueEntryJpaEntity e where e.shopId = :shopId")
    Optional<Integer> findHighestToken(@Param("shopId") String shopId);

    @Query("""
            select max(e.position) from QueueEntryJpaEntity e
            where e.shopId = :shopId and e.status in :statuses
            """)
    Optional<Integer> findHighestPosition(
            @Param("shopId") String shopId, @Param("statuses") Collection<QueueStatus> statuses);
}
