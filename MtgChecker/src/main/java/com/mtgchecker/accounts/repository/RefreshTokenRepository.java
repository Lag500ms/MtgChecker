package com.mtgchecker.accounts.repository;

import com.mtgchecker.accounts.entity.RefreshToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    @EntityGraph(attributePaths = {"account", "account.roles", "account.roles.permissions"})
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @EntityGraph(attributePaths = {"account", "account.roles", "account.roles.permissions"})
    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);

    void deleteByAccountId(String accountId);
}
