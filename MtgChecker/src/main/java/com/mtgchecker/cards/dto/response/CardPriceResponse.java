package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardPriceResponse {

    private String usd;

    private String usdFoil;

    private String usdEtched;

    private String eur;

    private String eurFoil;

    private String tix;
}
