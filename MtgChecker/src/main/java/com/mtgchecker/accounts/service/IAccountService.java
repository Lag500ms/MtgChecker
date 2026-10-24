package com.mtgchecker.accounts.service;

import com.mtgchecker.accounts.dto.response.AccountResponse;

import java.util.List;
import java.util.Set;

public interface IAccountService {

    AccountResponse getCurrentAccount();

    List<AccountResponse> findAllAccounts();

    AccountResponse updateRole(String accountId, String roleName);

    AccountResponse updateRoles(String accountId, Set<String> roleNames);

    AccountResponse addRole(String accountId, String roleName);

    AccountResponse removeRole(String accountId, String roleName);
}
