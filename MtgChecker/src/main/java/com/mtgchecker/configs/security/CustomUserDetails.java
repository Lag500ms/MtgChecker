package com.mtgchecker.configs.security;

import com.mtgchecker.accounts.entity.Account;
import com.mtgchecker.accounts.entity.Role;
import com.mtgchecker.accounts.enums.AppPermissions;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Account account;

    public CustomUserDetails(Account account) {
        this.account = account;
    }

    public String getAccountId() {
        return account.getId();
    }

    public int getTokenVersion() {
        return account.getTokenVersion();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        Set<String> roleNames = account.getRoleNames();

        for (String rName : roleNames) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + rName));
        }

        if (roleNames.contains("ADMIN")) {
            for (String perm : AppPermissions.ALL_PERMISSIONS) {
                authorities.add(new SimpleGrantedAuthority(perm));
            }
        } else if (account.getRoles() != null) {
            for (Role role : account.getRoles()) {
                if (role.getPermissions() != null) {
                    for (String perm : role.getPermissions()) {
                        authorities.add(new SimpleGrantedAuthority(perm));
                    }
                }
            }
        }

        return authorities;
    }

    @Override
    public String getPassword() {
        return account.getPassword();
    }

    @Override
    public String getUsername() {
        return account.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return account.isActive();
    }
}
