package com.mtgchecker.inventory.repository;

import com.mtgchecker.inventory.entity.OwnedCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OwnedCardRepository extends JpaRepository<OwnedCard, String> {

    Optional<OwnedCard> findByAccountIdAndScryfallIdAndFinish(String accountId, String scryfallId, String finish);

    List<OwnedCard> findByAccountIdOrderByNameAscSetCodeAsc(String accountId);

    Optional<OwnedCard> findByIdAndAccountId(String id, String accountId);

    boolean existsByIdAndAccountId(String id, String accountId);
}
