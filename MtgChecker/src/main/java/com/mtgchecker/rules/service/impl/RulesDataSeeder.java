package com.mtgchecker.rules.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtgchecker.rules.dto.response.CheatSheetResponse;
import com.mtgchecker.rules.dto.response.FormatRuleResponse;
import com.mtgchecker.rules.entity.ComprehensiveRule;
import com.mtgchecker.rules.entity.FormatRule;
import com.mtgchecker.rules.entity.QuickDispute;
import com.mtgchecker.rules.entity.RuleCheatSheet;
import com.mtgchecker.rules.entity.RuleGlossary;
import com.mtgchecker.rules.repository.ComprehensiveRuleRepository;
import com.mtgchecker.rules.repository.FormatRuleRepository;
import com.mtgchecker.rules.repository.QuickDisputeRepository;
import com.mtgchecker.rules.repository.RuleCheatSheetRepository;
import com.mtgchecker.rules.repository.RuleGlossaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RulesDataSeeder implements ApplicationRunner {

    private final RuleCheatSheetRepository cheatSheetRepository;
    private final QuickDisputeRepository quickDisputeRepository;
    private final FormatRuleRepository formatRuleRepository;
    private final ComprehensiveRuleRepository comprehensiveRuleRepository;
    private final RuleGlossaryRepository ruleGlossaryRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) {
        try {
            seedCheatSheets();
        } catch (Exception e) {
            log.warn("Failed to seed cheat sheets: {}", e.getMessage());
        }

        try {
            seedQuickDisputes();
        } catch (Exception e) {
            log.warn("Failed to seed quick disputes: {}", e.getMessage());
        }

        try {
            seedFormatRules();
        } catch (Exception e) {
            log.warn("Failed to seed format rules: {}", e.getMessage());
        }

        try {
            seedComprehensiveRules();
        } catch (Exception e) {
            log.warn("Failed to seed comprehensive rules: {}", e.getMessage());
        }

        try {
            seedRuleGlossary();
        } catch (Exception e) {
            log.warn("Failed to seed rule glossary: {}", e.getMessage());
        }
    }

    private void seedCheatSheets() throws Exception {
        if (cheatSheetRepository.count() > 0) {
            return;
        }

        List<RuleCheatSheet> sheets = new ArrayList<>();

        List<CheatSheetResponse.SectionDto> turnSections = List.of(
                CheatSheetResponse.SectionDto.builder()
                        .heading("1. Beginning Phase (CR 501)")
                        .description("First phase of each turn where permanents reset and cards are drawn.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Untap Step (CR 502)")
                                        .details("Active player untaps all permanents. Phasing occurs here. No player receives priority; spells cannot be cast.")
                                        .crCode("CR 502.4")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Upkeep Step (CR 503)")
                                        .details("Triggers matching 'at the beginning of your upkeep' trigger. Active player receives priority first. Instants and abilities can be played.")
                                        .crCode("CR 503.1")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Draw Step (CR 504)")
                                        .details("Active player draws one card as a turn-based action. Then players receive priority to cast instants before moving to Main Phase.")
                                        .crCode("CR 504.1")
                                        .build()
                        ))
                        .build(),
                CheatSheetResponse.SectionDto.builder()
                        .heading("2. Pre-Combat Main Phase (CR 505)")
                        .description("Active player has priority with an empty stack. Can play lands and cast any spell type: Creatures, Sorceries, Artifacts, Enchantments, Planeswalkers.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Playing Lands (CR 305)")
                                        .details("Special action, doesn't use the stack. Cannot be countered or responded to. Max 1 land per turn unless modified.")
                                        .crCode("CR 305.1")
                                        .build()
                        ))
                        .build(),
                CheatSheetResponse.SectionDto.builder()
                        .heading("3. Combat Phase (CR 506)")
                        .description("Five sequential steps: Beginning of Combat, Declare Attackers, Declare Blockers, Combat Damage, End of Combat.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Priority in Combat")
                                        .details("All players receive priority in every combat step EXCEPT Combat Damage (where damage is dealt as a turn-based action before priority).")
                                        .crCode("CR 506.1")
                                        .build()
                        ))
                        .build(),
                CheatSheetResponse.SectionDto.builder()
                        .heading("4. Ending Phase (CR 512)")
                        .description("End of turn cleanup and damage removal.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("End Step (CR 513)")
                                        .details("'At the beginning of the end step' triggers go onto the stack. Players receive priority.")
                                        .crCode("CR 513.1")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Cleanup Step (CR 514)")
                                        .details("Active player discards to max hand size (usually 7). All marked damage is removed, 'until end of turn' effects expire. No priority unless a state-based action triggers.")
                                        .crCode("CR 514.1")
                                        .build()
                        ))
                        .build()
        );

        sheets.add(RuleCheatSheet.builder()
                .id("turn_phases")
                .title("Turn Structure & Priority")
                .subtitle("Step-by-step phases, timing windows & when you get priority to cast spells")
                .icon("clock")
                .badge("CR 500")
                .sectionsJson(objectMapper.writeValueAsString(turnSections))
                .displayOrder(1)
                .build());

        List<CheatSheetResponse.SectionDto> layerSections = List.of(
                CheatSheetResponse.SectionDto.builder()
                        .heading("The 7 Layers of Continuous Effects (CR 613)")
                        .description("Continuous effects interact in a strict hierarchical order. Earlier layers apply before later layers regardless of timestamp.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 1: Copy Effects")
                                        .details("Clone, Copy, Mutate, Face-down status. Determines the printed card base.")
                                        .crCode("CR 613.1a")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 2: Control Effects")
                                        .details("Act of Treason, Control Magic, Mind Flayer.")
                                        .crCode("CR 613.1b")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 3: Text Effects")
                                        .details("Magical Hack, Mind Bend (changing color words or land types in text).")
                                        .crCode("CR 613.1c")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 4: Type Effects")
                                        .details("Blood Moon, Urborg, Song of the Dryads, turning cards into Artifacts/Lands/Creatures.")
                                        .crCode("CR 613.1d")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 5: Color Effects")
                                        .details("Painter's Servant, Darkest Hour, Moonlace.")
                                        .crCode("CR 613.1e")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 6: Ability Adding / Removing")
                                        .details("Humility, Dress Down, archetypes, granting Flying/Hexproof.")
                                        .crCode("CR 613.1f")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Layer 7: Power & Toughness (Sublayers)")
                                        .details("7a: Characteristic-Defining (Tarmogoyf) -> 7b: Set P/T (Humility 1/1) -> 7c: Modify P/T (+X/+X, Anthem) -> 7d: Counters (+1/+1, -1/-1) -> 7e: Switch P/T (Twisted Image).")
                                        .crCode("CR 613.1g")
                                        .build()
                        ))
                        .build()
        );

        sheets.add(RuleCheatSheet.builder()
                .id("seven_layers")
                .title("The 7 Layers System")
                .subtitle("Hierarchical rule for resolving simultaneous continuous effects (Humility, Blood Moon, Urborg)")
                .icon("layers")
                .badge("CR 613")
                .sectionsJson(objectMapper.writeValueAsString(layerSections))
                .displayOrder(2)
                .build());

        List<CheatSheetResponse.SectionDto> stackSections = List.of(
                CheatSheetResponse.SectionDto.builder()
                        .heading("The Stack & Priority Order (CR 405 & CR 117)")
                        .description("The zone where spells and abilities wait to resolve using LIFO (Last In, First Out).")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("LIFO (Last In, First Out)")
                                        .details("The most recently cast spell or activated ability on top resolves first.")
                                        .crCode("CR 405.2")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("APNAP Rule (CR 101.4)")
                                        .details("Active Player, Non-Active Player order: When multiple triggers happen at once, Active Player puts triggers on stack first, then Non-Active Players. NAP triggers resolve first!")
                                        .crCode("CR 101.4")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("State-Based Actions (CR 704)")
                                        .details("Checked right before any player receives priority: 0 toughness dies, lethal damage destroys, legend rule applies. Cannot be responded to.")
                                        .crCode("CR 704.3")
                                        .build()
                        ))
                        .build()
        );

        sheets.add(RuleCheatSheet.builder()
                .id("the_stack")
                .title("The Stack & Priority")
                .subtitle("LIFO mechanics, APNAP simultaneous triggers & State-Based Actions")
                .icon("list")
                .badge("CR 117")
                .sectionsJson(objectMapper.writeValueAsString(stackSections))
                .displayOrder(3)
                .build());

        List<CheatSheetResponse.SectionDto> keywordSections = List.of(
                CheatSheetResponse.SectionDto.builder()
                        .heading("Key Evergreen & Tournament Mechanics (CR 702)")
                        .description("Critical keyword interactions encountered in competitive play.")
                        .items(List.of(
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Deathtouch + Trample (CR 702.2 & 702.19)")
                                        .details("Only 1 point of deathtouch damage is lethal. All remaining power tramples over to defending player/planeswalker.")
                                        .crCode("CR 702.19b")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Ward (CR 702.21)")
                                        .details("Triggered ability, not protection/hexproof. Triggers when targeted by opponent spell/ability. Countered unless opponent pays ward cost.")
                                        .crCode("CR 702.21a")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Phasing (CR 702.26)")
                                        .details("Phased out permanents are treated as though they do not exist. They do NOT change zones, do not trigger enter/leave the battlefield, and keep all attached auras/counters.")
                                        .crCode("CR 702.26d")
                                        .build(),
                                CheatSheetResponse.ItemDto.builder()
                                        .term("Cascade (CR 702.85)")
                                        .details("Triggered upon casting the spell (not upon resolution). Cascade resolves before the original spell resolves.")
                                        .crCode("CR 702.85a")
                                        .build()
                        ))
                        .build()
        );

        sheets.add(RuleCheatSheet.builder()
                .id("keyword_mechanics")
                .title("Keyword & Combat Rules")
                .subtitle("Deathtouch + Trample, Ward triggers, Phasing mechanics & Cascade timing")
                .icon("shield")
                .badge("CR 702")
                .sectionsJson(objectMapper.writeValueAsString(keywordSections))
                .displayOrder(4)
                .build());

        cheatSheetRepository.saveAll(sheets);
        log.info("Seeded {} MTG official rules cheat sheets into database", sheets.size());
    }

    private void seedQuickDisputes() throws Exception {
        if (quickDisputeRepository.count() > 0) {
            return;
        }

        List<QuickDispute> disputes = new ArrayList<>();

        disputes.add(QuickDispute.builder()
                .id("doubling_season_pw")
                .query("Doubling Season + Planeswalker")
                .cardNamesJson(objectMapper.writeValueAsString(List.of("Doubling Season")))
                .verdict("YES")
                .verdictTitle("Planeswalker enters with DOUBLED loyalty counters!")
                .summary("A Planeswalker entering the battlefield with starting loyalty counters is treated by the rules as a replacement effect that puts counters on it. Because an effect is placing counters on a permanent under your control, Doubling Season doubles the starting loyalty (e.g. 4 becomes 8). NOTE: Activating a +X loyalty ability is a COST, not an effect, so activating abilities is NOT doubled.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Planeswalker spell resolves and enters the battlefield.",
                        "2. CR 306.5b applies: It enters with starting loyalty counters.",
                        "3. Doubling Season replacement effect replaces N counters with 2N counters.",
                        "4. Planeswalker arrives on the battlefield with double starting loyalty ready to ultimate!"
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 306.5b", "CR 614.1c", "CR 606.4")))
                .category("ETB")
                .displayOrder(1)
                .build());

        disputes.add(QuickDispute.builder()
                .id("blood_moon_urzas_saga")
                .query("Blood Moon + Urza's Saga")
                .cardNamesJson(objectMapper.writeValueAsString(List.of("Blood Moon", "Urza's Saga")))
                .verdict("NO")
                .verdictTitle("Urza's Saga immediately DIES and goes to Graveyard!")
                .summary("Blood Moon turns all nonbasic lands into Mountains in Layer 4 (type-changing). Urza's Saga is an Enchantment Land - Saga. Blood Moon removes all of its written abilities and chapter abilities. However, it is STILL a Saga enchantment with lore counters on it. Because it is a Saga with 0 chapter abilities, its maximum chapter number is 0. Since its lore counter count is >= its maximum chapter count (0), State-Based Action 704.5s immediately sacrifices it to the graveyard!")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Blood Moon applies in Layer 4, making Urza's Saga a Mountain with no abilities.",
                        "2. Urza's Saga retains the Saga subtype and any lore counters on it.",
                        "3. Chapter count is now 0. State-Based Action 704.5s checks lore counters >= 0.",
                        "4. Urza's Saga is placed into the graveyard as a State-Based Action (no trigger, no response possible)."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 613.1d", "CR 704.5s", "CR 714.2d")))
                .category("LAYERS")
                .displayOrder(2)
                .build());

        disputes.add(QuickDispute.builder()
                .id("deathtouch_trample")
                .query("Deathtouch + Trample vs Blocker")
                .cardNamesJson(objectMapper.writeValueAsString(List.of()))
                .verdict("YES")
                .verdictTitle("Assign ONLY 1 damage to blocker, rest tramples over!")
                .summary("Under CR 702.2c and 702.19b, any nonzero amount of combat damage assigned by a source with deathtouch is considered lethal damage. An attacking creature with deathtouch and trample only needs to assign 1 point of damage to each blocking creature (even if the blocker has 100 toughness or Indestructible) before assigning all remaining power to the defending player or planeswalker.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Attacker with Deathtouch + Trample is blocked.",
                        "2. In Combat Damage step, active player assigns 1 damage to each blocker.",
                        "3. Because 1 damage is lethal via Deathtouch (CR 702.2c), all remaining damage can be assigned to player/planeswalker via Trample (CR 702.19b)."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 702.2c", "CR 702.19b", "CR 510.1c")))
                .category("COMBAT")
                .displayOrder(3)
                .build());

        disputes.add(QuickDispute.builder()
                .id("humility_opalescence")
                .query("Humility + Opalescence")
                .cardNamesJson(objectMapper.writeValueAsString(List.of("Humility", "Opalescence")))
                .verdict("CONDITIONAL")
                .verdictTitle("Depends on Timestamps in Layer 7b!")
                .summary("Both apply in Layer 4 (Opalescence turns enchantments into creatures) and Layer 6 (Humility removes all abilities from creatures). In Layer 7b (setting P/T), Opalescence wants P/T = mana value, Humility wants P/T = 1/1. Because neither depends on the other in Layer 7b, the effect with the newest timestamp wins! If Humility entered last, all creatures are 1/1s with no abilities. If Opalescence entered last, other enchantments have P/T = mana value but still have no abilities.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Layer 4: Opalescence makes non-Aura enchantments into creatures.",
                        "2. Layer 6: Humility removes all abilities from all creatures.",
                        "3. Layer 7b: Both attempt to set P/T. Timestamp rule applies: Whichever permanent entered the battlefield most recently takes precedence."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 613.1d", "CR 613.1f", "CR 613.1g", "CR 613.7")))
                .category("LAYERS")
                .displayOrder(4)
                .build());

        disputes.add(QuickDispute.builder()
                .id("phasing_tokens")
                .query("Phasing vs Tokens (Teferi's Protection)")
                .cardNamesJson(objectMapper.writeValueAsString(List.of("Teferi's Protection")))
                .verdict("YES")
                .verdictTitle("Tokens DO NOT cease to exist when Phased Out!")
                .summary("Prior to Commander 2017 (CR change 702.26d), tokens that phased out ceased to exist. Under current rules, tokens that phase out phase back in during their controller's next untap step just like any other permanent! Phasing does not cause zone changes, so tokens stay alive safely under Teferi's Protection.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Teferi's Protection resolves: All permanents you control phase out, including creature tokens.",
                        "2. CR 702.26d: Tokens remain phased out. They do NOT leave the battlefield.",
                        "3. During your next untap step, tokens phase in simultaneously before you untap."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 702.26d", "CR 502.1")))
                .category("TIMING")
                .displayOrder(5)
                .build());

        disputes.add(QuickDispute.builder()
                .id("dress_down_etb")
                .query("Dress Down vs Enter-The-Battlefield (ETB)")
                .cardNamesJson(objectMapper.writeValueAsString(List.of("Dress Down", "Thassa's Oracle", "Kroxa")))
                .verdict("NO")
                .verdictTitle("Creatures enter with NO abilities, ETB DOES NOT TRIGGER!")
                .summary("Dress Down applies in Layer 6 to all creatures on the battlefield. Under CR 603.6a, an enter-the-battlefield ability triggers when a permanent enters the battlefield with that ability. Because Dress Down's continuous effect removes all abilities continuously from the moment the permanent exists on the battlefield, the creature enters with no abilities and its ETB trigger never triggers (e.g. Thassa's Oracle does nothing, Kroxa does not sacrifice itself).")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Creature spell resolves while Dress Down is on the battlefield.",
                        "2. As it enters, Dress Down applies in Layer 6 removing all abilities.",
                        "3. CR 603.6a checks if the creature has an ETB trigger: It does not.",
                        "4. No ability triggers."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 613.1f", "CR 603.6a")))
                .category("ETB")
                .displayOrder(6)
                .build());

        disputes.add(QuickDispute.builder()
                .id("commander_combat_damage_only")
                .query("Commander Damage vs Noncombat Damage")
                .cardNamesJson(objectMapper.writeValueAsString(List.of()))
                .verdict("NO")
                .verdictTitle("Commander Damage applies ONLY to Combat Damage!")
                .summary("Under CR 903.10a, a player loses only if dealt 21 or more combat damage by a single commander over the course of the game. Damage from activated abilities (like Niv-Mizzet or Heartless Hidetsugu) or triggered spell damage is noncombat damage and does NOT count toward the 21 commander damage lethal threshold.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Attacking commander deals combat damage during Combat Damage step (CR 510.1b).",
                        "2. Game tracks total combat damage dealt by this specific commander card (CR 903.10a).",
                        "3. Ability/spell noncombat damage reduces life total as normal, but does NOT count toward 21 commander damage."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 903.10a", "CR 120.2a", "CR 120.2b")))
                .category("COMMANDER")
                .displayOrder(7)
                .build());

        disputes.add(QuickDispute.builder()
                .id("commander_death_trigger")
                .query("Does Commander Trigger 'Dies' before Command Zone?")
                .cardNamesJson(objectMapper.writeValueAsString(List.of()))
                .verdict("YES")
                .verdictTitle("Commander touches Graveyard first, 'Dies' triggers ALWAYS fire!")
                .summary("Under CR 903.9a, a commander dies or is exiled first. Then, during the State-Based Actions check, its owner may choose to return it to the Command Zone. All death triggers (such as Blood Artist, Grave Pact, or the commander's own dies trigger) fire as normal.")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Commander is destroyed or sacrificed.",
                        "2. It is moved into its owner's graveyard (CR 700.4 dies).",
                        "3. Death triggers are triggered (CR 603.2).",
                        "4. State-Based Action check: Owner chooses whether to move commander to command zone (CR 903.9a).",
                        "5. Triggers are put on the stack in APNAP order (CR 117.5)."
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 903.9a", "CR 700.4", "CR 704.5")))
                .category("COMMANDER")
                .displayOrder(8)
                .build());

        disputes.add(QuickDispute.builder()
                .id("apnap_upkeep_triggers")
                .query("Whose Upkeep Trigger resolves first (APNAP)?")
                .cardNamesJson(objectMapper.writeValueAsString(List.of()))
                .verdict("CONDITIONAL")
                .verdictTitle("Active Player stacks first, Non-Active Player resolves FIRST!")
                .summary("Under CR 101.4 (APNAP order) and CR 603.3b, when multiple abilities trigger at the same time (e.g. beginning of upkeep), the Active Player puts their triggers on the stack first in any order, then the Non-Active Player puts their triggers on top. Because the stack resolves Last-In First-Out (LIFO), the Non-Active Player's triggers resolve first!")
                .stackStepsJson(objectMapper.writeValueAsString(List.of(
                        "1. Upkeep step begins (CR 503.1).",
                        "2. Active Player puts all triggered abilities they control onto the stack first.",
                        "3. Non-Active Player puts all triggered abilities they control on top of the stack.",
                        "4. Stack resolves from top to bottom (LIFO): Non-Active Player's triggers resolve first (CR 405.5)!"
                )))
                .crRulesJson(objectMapper.writeValueAsString(List.of("CR 101.4", "CR 603.3b", "CR 405.5")))
                .category("TIMING")
                .displayOrder(9)
                .build());

        quickDisputeRepository.saveAll(disputes);
        log.info("Seeded {} MTG table dispute rulings into database", disputes.size());
    }

    private void seedFormatRules() throws Exception {
        if (formatRuleRepository.count() > 0) {
            return;
        }

        List<FormatRule> formats = new ArrayList<>();

        List<FormatRuleResponse.FormatKeyRuleResponse> commanderKeyRules = List.of(
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("100-Card Singleton")
                        .description("Exactly 100 cards including commander(s). No duplicate cards allowed except basic lands.")
                        .crCitation("CR 903.5a, CR 903.5b")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Color Identity")
                        .description("Every card in the deck must contain only mana symbols found within the commander's color identity (mana cost + rules text).")
                        .crCitation("CR 903.4")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Commander Damage (21)")
                        .description("A player dealt 21 or more combat damage by a single commander over the game loses immediately as a State-Based Action.")
                        .crCitation("CR 903.10a, CR 704.5j")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Commander Tax (+{2})")
                        .description("Casting your commander from the command zone costs an additional {2} generic mana for each previous time cast from there.")
                        .crCitation("CR 903.8")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Free First Mulligan")
                        .description("In multiplayer games, each player's first mulligan is completely free (draw 7 without tucking a card to bottom).")
                        .crCitation("CR 103.5c, CR 800.6")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Command Zone SBA")
                        .description("When a commander enters the graveyard or exile, its owner may choose to move it to the command zone as a State-Based Action.")
                        .crCitation("CR 903.9a")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("No Sideboard")
                        .description("Commander games do not use sideboards, and effects that bring cards from outside the game cannot bring cards in.")
                        .crCitation("CR 903.5e, CR 903.11")
                        .build()
        );

        formats.add(FormatRule.builder()
                .id("commander")
                .name("Commander / EDH")
                .badge("CR 903")
                .icon("award")
                .summary("A 100-card multiplayer singleton format where decks are led by a legendary Commander.")
                .startingLife(40)
                .minDeckSize(100)
                .maxDeckSize(100)
                .keyRulesJson(objectMapper.writeValueAsString(commanderKeyRules))
                .displayOrder(1)
                .build());

        List<FormatRuleResponse.FormatKeyRuleResponse> standardKeyRules = List.of(
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("60-Card Minimum")
                        .description("Decks must have at least 60 cards. Up to 4 copies of any nonbasic card are allowed.")
                        .crCitation("CR 100.2a")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("15-Card Sideboard")
                        .description("Optional sideboard of up to 15 cards for best-of-three match play.")
                        .crCitation("CR 100.4a")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("3-Year Rotation")
                        .description("Constructed format using premier sets released in the past 3 years.")
                        .crCitation("CR 206.4")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("London Mulligan")
                        .description("Draw 7 cards, then put cards on bottom of library equal to mulligan count.")
                        .crCitation("CR 103.5")
                        .build()
        );

        formats.add(FormatRule.builder()
                .id("standard")
                .name("Standard")
                .badge("CR 100.2")
                .icon("zap")
                .summary("Dynamic 60-card constructed format using premier expansions from the past three years.")
                .startingLife(20)
                .minDeckSize(60)
                .maxDeckSize(null)
                .keyRulesJson(objectMapper.writeValueAsString(standardKeyRules))
                .displayOrder(2)
                .build());

        List<FormatRuleResponse.FormatKeyRuleResponse> modernKeyRules = List.of(
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("60-Card Minimum")
                        .description("Decks must have at least 60 cards. Up to 4 copies of any nonbasic card.")
                        .crCitation("CR 100.2a")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Non-Rotating Pool")
                        .description("All core and expansion sets since Eighth Edition (2003) plus Modern Horizons series.")
                        .crCitation("CR 206.4")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("15-Card Sideboard")
                        .description("Up to 15 cards used to swap between games in a match.")
                        .crCitation("CR 100.4a")
                        .build()
        );

        formats.add(FormatRule.builder()
                .id("modern")
                .name("Modern")
                .badge("CR 100.2")
                .icon("shield")
                .summary("Popular non-rotating constructed format spanning sets from 2003 to present.")
                .startingLife(20)
                .minDeckSize(60)
                .maxDeckSize(null)
                .keyRulesJson(objectMapper.writeValueAsString(modernKeyRules))
                .displayOrder(3)
                .build());

        List<FormatRuleResponse.FormatKeyRuleResponse> twoHeadedKeyRules = List.of(
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Shared 30 Life")
                        .description("Teams start with a shared total of 30 life. Damage and life loss apply to the team total.")
                        .crCitation("CR 810.4, CR 810.9")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("15 Poison Counters")
                        .description("Teams lose as a state-based action upon accumulating 15 total poison counters.")
                        .crCitation("CR 810.8d, CR 810.10")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Shared Turn & Combat")
                        .description("Team members take turns simultaneously and declare attacking and blocking creatures as a team.")
                        .crCitation("CR 805.4, CR 805.10")
                        .build(),
                FormatRuleResponse.FormatKeyRuleResponse.builder()
                        .title("Team Priority")
                        .description("Teams receive and pass priority as a unit. Teammates may review each other's hands freely.")
                        .crCitation("CR 805.5, CR 809.7")
                        .build()
        );

        formats.add(FormatRule.builder()
                .id("two_headed_giant")
                .name("Two-Headed Giant (2HG)")
                .badge("CR 810")
                .icon("users")
                .summary("Multiplayer variant where two teams of two players share life and combat turns.")
                .startingLife(30)
                .minDeckSize(60)
                .maxDeckSize(null)
                .keyRulesJson(objectMapper.writeValueAsString(twoHeadedKeyRules))
                .displayOrder(4)
                .build());

        formatRuleRepository.saveAll(formats);
        log.info("Seeded {} MTG format rules into database", formats.size());
    }

    private void seedComprehensiveRules() {
        if (comprehensiveRuleRepository.count() > 0) {
            log.info("Comprehensive rules already present in database (count: {})", comprehensiveRuleRepository.count());
            return;
        }
        try (InputStream stream = getClass().getResourceAsStream("/rules/cr_rules.json")) {
            if (stream == null) {
                log.warn("cr_rules.json not found on classpath");
                return;
            }
            List<ComprehensiveRule> rules = objectMapper.readValue(stream, new TypeReference<List<ComprehensiveRule>>() {});
            log.info("Starting to seed {} Comprehensive Rules into database in batches...", rules.size());
            int batchSize = 200;
            for (int i = 0; i < rules.size(); i += batchSize) {
                int end = Math.min(i + batchSize, rules.size());
                comprehensiveRuleRepository.saveAll(rules.subList(i, end));
            }
            log.info("Successfully seeded {} Comprehensive Rules into database", rules.size());
        } catch (Exception e) {
            log.error("Failed to seed Comprehensive Rules: {}", e.getMessage(), e);
        }
    }

    private void seedRuleGlossary() {
        if (ruleGlossaryRepository.count() > 0) {
            log.info("Rule glossary already present in database (count: {})", ruleGlossaryRepository.count());
            return;
        }
        try (InputStream stream = getClass().getResourceAsStream("/rules/cr_glossary.json")) {
            if (stream == null) {
                log.warn("cr_glossary.json not found on classpath");
                return;
            }
            List<RuleGlossary> glossary = objectMapper.readValue(stream, new TypeReference<List<RuleGlossary>>() {});
            log.info("Starting to seed {} Rule Glossary terms into database in batches...", glossary.size());
            int batchSize = 200;
            for (int i = 0; i < glossary.size(); i += batchSize) {
                int end = Math.min(i + batchSize, glossary.size());
                ruleGlossaryRepository.saveAll(glossary.subList(i, end));
            }
            log.info("Successfully seeded {} Rule Glossary terms into database", glossary.size());
        } catch (Exception e) {
            log.error("Failed to seed Rule Glossary: {}", e.getMessage(), e);
        }
    }
}
