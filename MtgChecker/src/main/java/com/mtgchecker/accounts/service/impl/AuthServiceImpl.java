package com.mtgchecker.accounts.service.impl;

import com.mtgchecker.accounts.dto.request.LoginRequest;
import com.mtgchecker.accounts.dto.request.RefreshTokenRequest;
import com.mtgchecker.accounts.dto.request.RegisterRequest;
import com.mtgchecker.accounts.dto.response.AccountResponse;
import com.mtgchecker.accounts.dto.response.AuthResponse;
import com.mtgchecker.accounts.entity.Account;
import com.mtgchecker.accounts.entity.RefreshToken;
import com.mtgchecker.accounts.entity.Role;
import com.mtgchecker.accounts.enums.AppPermissions;
import com.mtgchecker.accounts.repository.AccountRepository;
import com.mtgchecker.accounts.repository.RefreshTokenRepository;
import com.mtgchecker.accounts.repository.RoleRepository;
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
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
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

        Role userRole = roleRepository.findByNameIgnoreCase("USER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("USER")
                        .description("Standard User")
                        .system(true)
                        .permissions(new HashSet<>(AppPermissions.DEFAULT_USER_PERMISSIONS))
                        .build()));

        Account account = Account.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .roles(new HashSet<>(Set.of(userRole)))
                .active(true)
                .build();
        Account saved = accountRepository.save(account);
        return issueTokens(saved);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Account account = accountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), account.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        if (!account.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }
        return issueTokens(account);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();
        String hash = hash(rawToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        Account account = token.getAccount();
        if (!account.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }
        return issueTokens(account);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        String hash = hash(request.getRefreshToken());
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    private AuthResponse issueTokens(Account account) {
        Set<String> roleNames = account.getRoleNames();
        String accessToken = jwtUtil.generateAccessToken(
                account.getId(),
                account.getEmail(),
                new ArrayList<>(roleNames),
                account.getTokenVersion());
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

    public static AccountResponse toResponse(Account account) {
        Set<String> roleNames = account.getRoleNames();
        Set<String> permissions = new HashSet<>();

        if (roleNames.contains("ADMIN")) {
            permissions.addAll(AppPermissions.ALL_PERMISSIONS);
        } else if (account.getRoles() != null) {
            for (Role role : account.getRoles()) {
                if (role.getPermissions() != null) {
                    permissions.addAll(role.getPermissions());
                }
            }
        }

        return AccountResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .displayName(account.getDisplayName())
                .role(account.getRoleName())
                .roles(roleNames)
                .permissions(permissions)
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
            throw new IllegalStateException("SHA-256 not available", exception);
        }
    }
}
