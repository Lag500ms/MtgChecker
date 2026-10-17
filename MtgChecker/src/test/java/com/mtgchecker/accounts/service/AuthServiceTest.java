package com.mtgchecker.accounts.service;

import com.mtgchecker.accounts.dto.request.LoginRequest;
import com.mtgchecker.accounts.dto.request.RefreshTokenRequest;
import com.mtgchecker.accounts.dto.request.RegisterRequest;
import com.mtgchecker.accounts.dto.response.AuthResponse;
import com.mtgchecker.accounts.repository.AccountRepository;
import com.mtgchecker.accounts.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private IAuthService authService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void clean() {
        refreshTokenRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void registerLoginRefreshAndLogout() {
        AuthResponse registered = authService.register(new RegisterRequest(
                "collector@example.com",
                "password123",
                "Collector"));
        assertNotNull(registered.getAccessToken());
        assertNotNull(registered.getRefreshToken());
        assertEquals("collector@example.com", registered.getAccount().getEmail());

        AuthResponse loggedIn = authService.login(new LoginRequest("collector@example.com", "password123"));
        assertEquals(registered.getAccount().getId(), loggedIn.getAccount().getId());

        AuthResponse refreshed = authService.refresh(new RefreshTokenRequest(loggedIn.getRefreshToken()));
        assertNotNull(refreshed.getAccessToken());
        assertTrue(refreshed.getRefreshToken().length() > 10);

        authService.logout(new RefreshTokenRequest(refreshed.getRefreshToken()));
        assertTrue(refreshTokenRepository.findAll().stream().allMatch(token ->
                token.isRevoked() || !token.getTokenHash().isBlank()));
    }
}
