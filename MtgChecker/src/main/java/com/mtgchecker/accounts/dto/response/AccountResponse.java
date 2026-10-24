package com.mtgchecker.accounts.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {

    private String id;

    private String email;

    private String displayName;

    private String role;

    private Set<String> roles;

    private Set<String> permissions;

    private boolean active;

    private boolean discordLinked;
}
