package com.mtgchecker.rules.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardInteractionRequest {

    @NotBlank(message = "Card A name is required")
    private String cardA;

    @NotBlank(message = "Card B name is required")
    private String cardB;

    private String timing;

    private String details;
}
