package com.mtgchecker.accounts.service.impl;

import com.mtgchecker.accounts.dto.request.LoginRequest;
import com.mtgchecker.accounts.dto.request.RefreshTokenRequest;
import com.mtgchecker.accounts.dto.request.RegisterRequest;
import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.dto.response.AuthResponse;
import com.mtgchecker.accounts.entity.Account;
import com.mtgchecker.accounts.entity.RefreshToken;
import com.mtgchecker.accounts.enums.AccountRole;
import com.mtgchecker.accounts.repository.AccountRepository;
import com.mtgchecker.accounts.repository.RefreshTokenRepository;
import com.mtgchecker.accounts.service.IAuthService;
import com.mtgchecker.configs.security.JwtUtil;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (accountRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email is already registered");
        }
        Account account = Account.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .role(AccountRole.USER)
                .active(true)
                .build();
        Account saved = accountRepository.save(account);
        return issueTokens(saved);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect"));
        if (!account.isActive()) {
            throw new UnauthorizedException("Account has been deactivated");
        }
        if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            throw new UnauthorizedException("Email or password is incorrect");
        }
        return issueTokens(account);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(request.getRefreshToken()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            throw new UnauthorizedException("Refresh token has expired");
        }
        stored.setRevoked(true);
        Account account = stored.getAccount();
        if (!account.isActive()) {
            throw new UnauthorizedException("Account has been deactivated");
        }
        return issueTokens(account);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(request.getRefreshToken()))
                .ifPresent(token -> token.setRevoked(true));
    }

    private AuthResponse issueTokens(Account account) {
        String accessToken = jwtUtil.generateAccessToken(
                account.getId(),
                account.getEmail(),
                List.of(account.getRole().name()));
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        refreshTokenRepository.save(RefreshToken.builder()
                .account(account)
                .tokenHash(hash(refreshToken))
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtUtil.getAccessExpirationMs())
                .account(toResponse(account))
                .build();
    }

    static AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .displayName(account.getDisplayName())
                .role(account.getRole())
                .active(account.isActive())
                .discordLinked(account.getDiscordId() != null)
                .build();
    }

    private static String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
