package com.mtgchecker.accounts.dto.response;

import com.mtgchecker.accounts.enums.AccountRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {

    private String id;

    private String email;

    private String displayName;

    private AccountRole role;

    private boolean active;

    private boolean discordLinked;
}
