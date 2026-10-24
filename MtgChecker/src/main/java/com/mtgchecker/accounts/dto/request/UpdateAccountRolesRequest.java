package com.mtgchecker.accounts.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountRolesRequest {

    @NotEmpty(message = "At least one role name is required")
    private Set<String> roleNames;
}
