package com.mtgchecker.accounts.service.impl;

import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.repository.AccountRepository;
import com.mtgchecker.accounts.service.IAccountService;
import com.mtgchecker.configs.security.SecurityUtil;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements IAccountService {

    private final AccountRepository accountRepository;

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getCurrentAccount() {
        String accountId = SecurityUtil.currentAccountId();
        return accountRepository.findById(accountId)
                .map(AuthServiceImpl::toResponse)
                .orElseThrow(() -> new NotFoundException("Account not found: " + accountId));
    }
}
