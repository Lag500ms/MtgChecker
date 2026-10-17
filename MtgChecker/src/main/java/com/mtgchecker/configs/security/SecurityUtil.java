package com.mtgchecker.configs.security;

import com.mtgchecker.exceptions.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static CustomUserDetails currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new UnauthorizedException("Authentication required");
        }
        return userDetails;
    }

    public static String currentAccountId() {
        return currentUser().getAccountId();
    }
}
