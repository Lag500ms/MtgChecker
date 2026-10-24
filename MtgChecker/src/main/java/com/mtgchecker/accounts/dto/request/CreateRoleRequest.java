package com.mtgchecker.accounts.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Pattern(regexp = "^[A-Za-z0-9_]{2,30}$", message = "Role name must be 2-30 characters, alphanumeric or underscore")
    private String name;

    private String description;

    @NotEmpty(message = "At least one permission is required")
    private Set<String> permissions;
}
