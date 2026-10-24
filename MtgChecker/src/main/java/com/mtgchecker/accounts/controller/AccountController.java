package com.mtgchecker.accounts.controller;

import com.mtgchecker.accounts.dto.request.UpdateAccountRoleRequest;
import com.mtgchecker.accounts.dto.request.UpdateAccountRolesRequest;
import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.service.IAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Account profile and multi-role assignment")
@SecurityRequirement(name = "Bearer Authentication")
public class AccountController {

    private final IAccountService accountService;

    @GetMapping("/me")
    @Operation(summary = "Get the current authenticated account with all roles & permissions")
    public ResponseEntity<AccountResponse> me() {
        return ResponseEntity.ok(accountService.getCurrentAccount());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ACCOUNT_MANAGE')")
    @Operation(summary = "List all accounts in system (Admin only)")
    public ResponseEntity<List<AccountResponse>> listAccounts() {
        return ResponseEntity.ok(accountService.findAllAccounts());
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ACCOUNT_MANAGE')")
    @Operation(summary = "Set a single role for a user (Admin only)")
    public ResponseEntity<AccountResponse> updateRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateAccountRoleRequest request
    ) {
        return ResponseEntity.ok(accountService.updateRole(id, request.getRoleName()));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ACCOUNT_MANAGE')")
    @Operation(summary = "Assign multiple roles to a user (Admin only)")
    public ResponseEntity<AccountResponse> updateRoles(
            @PathVariable String id,
            @Valid @RequestBody UpdateAccountRolesRequest request
    ) {
        return ResponseEntity.ok(accountService.updateRoles(id, request.getRoleNames()));
    }

    @PostMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ACCOUNT_MANAGE')")
    @Operation(summary = "Add an additional role to a user (Admin only)")
    public ResponseEntity<AccountResponse> addRole(
            @PathVariable String id,
            @PathVariable String roleName
    ) {
        return ResponseEntity.ok(accountService.addRole(id, roleName));
    }

    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ACCOUNT_MANAGE')")
    @Operation(summary = "Remove a specific role from a user (Admin only)")
    public ResponseEntity<AccountResponse> removeRole(
            @PathVariable String id,
            @PathVariable String roleName
    ) {
        return ResponseEntity.ok(accountService.removeRole(id, roleName));
    }
}
