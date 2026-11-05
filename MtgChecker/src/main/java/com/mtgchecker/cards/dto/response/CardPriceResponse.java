package com.mtgchecker.cards.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardPriceResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String usd;

    private String usdFoil;

    private String usdEtched;

    private String eur;

    private String eurFoil;

    private String tix;
}
