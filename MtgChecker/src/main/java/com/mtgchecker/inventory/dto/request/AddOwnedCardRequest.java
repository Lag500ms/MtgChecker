package com.mtgchecker.inventory.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddOwnedCardRequest {

    @NotBlank(message = "Set code is required")
    private String setCode;

    @NotBlank(message = "Collector number is required")
    private String collectorNumber;

    @NotBlank(message = "Finish is required")
    private String finish;

    private String condition;

    private String acquiredPriceUsd;

    private String storageLocation;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    public AddOwnedCardRequest(String setCode, String collectorNumber, String finish, Integer quantity) {
        this.setCode = setCode;
        this.collectorNumber = collectorNumber;
        this.finish = finish;
        this.quantity = quantity;
    }
}
