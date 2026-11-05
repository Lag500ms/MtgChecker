package com.mtgchecker.accounts.repository;

import com.mtgchecker.accounts.entity.Account;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Override
    List<Account> findAll();

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Override
    Optional<Account> findById(String id);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<Account> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
