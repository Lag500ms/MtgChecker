package com.mtgchecker.inventory.service;

import com.mtgchecker.accounts.entity.Account;
import com.mtgchecker.accounts.entity.Role;
import com.mtgchecker.accounts.enums.AppPermissions;
import com.mtgchecker.cards.dto.response.CardPriceResponse;
import com.mtgchecker.cards.dto.response.CardResponse;
import com.mtgchecker.cards.service.ICardService;
import com.mtgchecker.configs.security.CustomUserDetails;
import com.mtgchecker.inventory.dto.request.AddOwnedCardRequest;
import com.mtgchecker.inventory.dto.response.OwnedCardResponse;
import com.mtgchecker.inventory.repository.OwnedCardRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class InventoryServiceTest {

    @Autowired
    private IInventoryService inventoryService;

    @Autowired
    private OwnedCardRepository ownedCardRepository;

    @MockBean
    private ICardService cardService;

    @BeforeEach
    void cleanInventory() {
        ownedCardRepository.deleteAll();
        authenticateAs("account-1");
        when(cardService.findBySetAndCollectorNumber("m12", "165")).thenReturn(printing("m12", "165", "12.64", "18.50"));
        when(cardService.findBySetAndCollectorNumber("rvr", "133")).thenReturn(printing("rvr", "133", "15.32", "13.53"));
        when(cardService.findByIds(anyList())).thenAnswer(invocation -> {
            List<String> ids = invocation.getArgument(0);
            return ids.stream()
                    .map(id -> id.startsWith("m12")
                            ? printing("m12", "165", "12.64", "18.50")
                            : printing("rvr", "133", "15.32", "13.53"))
                    .toList();
        });
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void samePrintingIncreasesQuantityAndKeepsItsOwnPrice() {
        OwnedCardResponse first = inventoryService.add(new AddOwnedCardRequest("m12", "165", "nonfoil", 1));
        OwnedCardResponse again = inventoryService.add(new AddOwnedCardRequest("m12", "165", "foil", 1));
        inventoryService.add(new AddOwnedCardRequest("m12", "165", "nonfoil", 2));
        inventoryService.add(new AddOwnedCardRequest("rvr", "133", "foil", 1));

        assertEquals("nonfoil", first.getFinish());
        assertEquals("12.64", first.getPriceUsd());
        assertEquals("18.50", again.getPriceUsd());

        List<OwnedCardResponse> owned = inventoryService.findAll();
        assertEquals(3, owned.size());
        OwnedCardResponse m12Nonfoil = owned.stream()
                .filter(card -> "m12".equals(card.getSetCode()) && "nonfoil".equals(card.getFinish()))
                .findFirst()
                .orElseThrow();
        OwnedCardResponse rvrFoil = owned.stream()
                .filter(card -> "rvr".equals(card.getSetCode()))
                .findFirst()
                .orElseThrow();
        assertEquals(3, m12Nonfoil.getQuantity());
        assertEquals("12.64", m12Nonfoil.getPriceUsd());
        assertEquals("13.53", rvrFoil.getPriceUsd());
    }

    private static void authenticateAs(String accountId) {
        Account account = Account.builder()
                .id(accountId)
                .email(accountId + "@example.com")
                .password("hashed")
                .displayName("Tester")
                .roles(java.util.Set.of(Role.builder()
                        .name("USER")
                        .permissions(java.util.Set.copyOf(AppPermissions.DEFAULT_USER_PERMISSIONS))
                        .build()))
                .active(true)
                .build();
        CustomUserDetails userDetails = new CustomUserDetails(account);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
    }

    private static CardResponse printing(String set, String collectorNumber, String usd, String usdFoil) {
        return CardResponse.builder()
                .id(set + "-id")
                .oracleId("d3a0b660-358c-41bd-9cd2-41fbf3491b1a")
                .name("Birds of Paradise")
                .set(set)
                .setName(set)
                .collectorNumber(collectorNumber)
                .lang("en")
                .finishes(List.of("nonfoil", "foil"))
                .prices(CardPriceResponse.builder().usd(usd).usdFoil(usdFoil).build())
                .build();
    }
}
