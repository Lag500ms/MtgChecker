package com.mtgchecker.accounts.repository;

import com.mtgchecker.accounts.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    @EntityGraph(attributePaths = {"permissions"})
    @Override
    List<Role> findAll();

    @EntityGraph(attributePaths = {"permissions"})
    @Override
    Optional<Role> findById(String id);

    @EntityGraph(attributePaths = {"permissions"})
    Optional<Role> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
