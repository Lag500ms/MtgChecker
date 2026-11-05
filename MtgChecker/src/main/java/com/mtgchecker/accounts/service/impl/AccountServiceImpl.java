package com.mtgchecker.accounts.service.impl;

import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.entity.Account;
import com.mtgchecker.accounts.entity.Role;
import com.mtgchecker.accounts.repository.AccountRepository;
import com.mtgchecker.accounts.repository.RoleRepository;
import com.mtgchecker.accounts.service.IAccountService;
import com.mtgchecker.configs.security.SecurityUtil;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements IAccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getCurrentAccount() {
        String accountId = SecurityUtil.currentAccountId();
        return accountRepository.findById(accountId)
                .map(AuthServiceImpl::toResponse)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> findAllAccounts() {
        return accountRepository.findAll().stream()
                .map(AuthServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AccountResponse updateRole(String accountId, String roleName) {
        return updateRoles(accountId, Set.of(roleName));
    }

    @Override
    @Transactional
    public AccountResponse updateRoles(String accountId, Set<String> roleNames) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountId));

        if (roleNames == null || roleNames.isEmpty()) {
            throw new BadRequestException("At least one role is required");
        }

        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            Role role = roleRepository.findByNameIgnoreCase(name)
                    .orElseThrow(() -> new NotFoundException("Role not found with name: " + name));
            roles.add(role);
        }

        account.setRoles(roles);
        account.setTokenVersion(account.getTokenVersion() + 1);
        Account saved = accountRepository.save(account);
        return AuthServiceImpl.toResponse(saved);
    }

    @Override
    @Transactional
    public AccountResponse addRole(String accountId, String roleName) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountId));

        Role role = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new NotFoundException("Role not found with name: " + roleName));

        account.getRoles().add(role);
        account.setTokenVersion(account.getTokenVersion() + 1);
        Account saved = accountRepository.save(account);
        return AuthServiceImpl.toResponse(saved);
    }

    @Override
    @Transactional
    public AccountResponse removeRole(String accountId, String roleName) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountId));

        if (account.getRoles().size() <= 1) {
            throw new BadRequestException("Cannot remove the last role from an account");
        }

        account.getRoles().removeIf(r -> r.getName().equalsIgnoreCase(roleName));
        account.setTokenVersion(account.getTokenVersion() + 1);
        Account saved = accountRepository.save(account);
        return AuthServiceImpl.toResponse(saved);
    }
}
