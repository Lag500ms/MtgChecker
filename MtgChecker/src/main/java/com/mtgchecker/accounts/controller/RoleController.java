package com.mtgchecker.accounts.controller;

import com.mtgchecker.accounts.dto.request.CreateRoleRequest;
import com.mtgchecker.accounts.dto.request.UpdateRoleRequest;
import com.mtgchecker.accounts.dto.response.RoleResponse;
import com.mtgchecker.accounts.service.IRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Roles & Permissions", description = "Dynamic role management and permission granting (Admin only)")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_MANAGE')")
public class RoleController {

    private final IRoleService roleService;

    @GetMapping
    @Operation(summary = "Get all roles with their assigned permissions")
    public ResponseEntity<List<RoleResponse>> findAll() {
        return ResponseEntity.ok(roleService.findAll());
    }

    @GetMapping("/permissions")
    @Operation(summary = "Get list of all available system permissions that can be granted")
    public ResponseEntity<List<String>> getAvailablePermissions() {
        return ResponseEntity.ok(roleService.getAvailablePermissions());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get role details by UUID")
    public ResponseEntity<RoleResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(roleService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new custom role and assign permissions (Admin only)")
    public ResponseEntity<RoleResponse> create(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing role and its permissions (Admin only)")
    public ResponseEntity<RoleResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a custom role (Cannot delete system ADMIN or USER roles)")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
