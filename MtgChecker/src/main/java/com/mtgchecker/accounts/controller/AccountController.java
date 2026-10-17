package com.mtgchecker.accounts.controller;

import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.service.IAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts")
@SecurityRequirement(name = "Bearer Authentication")
public class AccountController {

    private final IAccountService accountService;

    @GetMapping("/me")
    @Operation(summary = "Get the current account")
    public ResponseEntity<AccountResponse> me() {
        return ResponseEntity.ok(accountService.getCurrentAccount());
    }
}
