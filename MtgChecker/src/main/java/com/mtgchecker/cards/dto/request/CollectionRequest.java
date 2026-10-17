package com.mtgchecker.cards.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionRequest {

    @NotEmpty(message = "Names are required")
    private List<@NotBlank(message = "Card name is required") String> names;
}
