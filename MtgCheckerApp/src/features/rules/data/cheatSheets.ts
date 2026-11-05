export type CheatSheetTopic = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  sections: {
    heading: string;
    description: string;
    items?: {
      term: string;
      details: string;
      crCode?: string;
    }[];
  }[];
};

export const CHEAT_SHEETS: CheatSheetTopic[] = [
  {
    id: 'turn_phases',
    title: 'Turn Structure & Priority',
    subtitle: 'Step-by-step phases, timing windows & when you get priority to cast spells',
    icon: 'clock',
    badge: 'CR 500',
    sections: [
      {
        heading: '1. Beginning Phase (CR 501)',
        description: 'First phase of each turn where permanents reset and cards are drawn.',
        items: [
          {
            term: 'Untap Step (CR 502)',
            details: 'Active player untaps all permanents. Phasing occurs here. No player receives priority; spells cannot be cast.',
            crCode: 'CR 502.4',
          },
          {
            term: 'Upkeep Step (CR 503)',
            details: 'Triggers matching "at the beginning of your upkeep" trigger. Active player receives priority first. Instants and abilities can be played.',
            crCode: 'CR 503.1',
          },
          {
            term: 'Draw Step (CR 504)',
            details: 'Active player draws one card as a turn-based action. Then players receive priority to cast instants before moving to Main Phase.',
            crCode: 'CR 504.1',
          },
        ],
      },
      {
        heading: '2. Pre-Combat Main Phase (CR 505)',
        description: 'Active player has priority with an empty stack. Can play lands and cast any spell type: Creatures, Sorceries, Artifacts, Enchantments, Planeswalkers.',
      },
      {
        heading: '3. Combat Phase (CR 506 - 511)',
        description: 'Five distinct steps where attacking, blocking and damage occur.',
        items: [
          {
            term: 'Beginning of Combat (CR 507)',
            details: 'Triggers matching "at the beginning of combat" resolve. Last opportunity to tap opponent creatures before they are declared as attackers.',
            crCode: 'CR 507.2',
          },
          {
            term: 'Declare Attackers (CR 508)',
            details: 'Active player chooses attackers simultaneously and taps them (unless Vigilance). Triggers resolve; players receive priority.',
            crCode: 'CR 508.1',
          },
          {
            term: 'Declare Blockers (CR 509)',
            details: 'Defending player assigns blockers. Attacker orders damage assignment if multi-blocked. Players receive priority for combat tricks.',
            crCode: 'CR 509.2',
          },
          {
            term: 'Combat Damage Step (CR 510)',
            details: 'Turn-based action: All creatures deal damage simultaneously. If First/Double Strike is involved, an extra damage step is created beforehand.',
            crCode: 'CR 510.1',
          },
          {
            term: 'End of Combat (CR 511)',
            details: 'Creatures cease being attackers or blockers. "Until end of combat" effects expire. Players receive priority.',
            crCode: 'CR 511.1',
          },
        ],
      },
      {
        heading: '4. Post-Combat Main Phase (CR 505)',
        description: 'Second main phase. Spells can be cast and lands played if land drop was not used.',
      },
      {
        heading: '5. Ending Phase (CR 512 - 514)',
        description: 'Cleanup and final resolution of the turn.',
        items: [
          {
            term: 'End Step (CR 513)',
            details: 'Triggers matching "at the beginning of the end step" resolve. Players receive priority. Often used to flash in threats on opponent turn.',
            crCode: 'CR 513.1',
          },
          {
            term: 'Cleanup Step (CR 514)',
            details: 'Active player discards down to maximum hand size (usually 7). Marked damage is removed, and "until end of turn" effects expire. No priority unless triggers occur.',
            crCode: 'CR 514.2',
          },
        ],
      },
    ],
  },
  {
    id: 'keyword_interactions',
    title: 'Keyword Abilities & Matchups',
    subtitle: 'Crucial rules interactions between keywords on the battlefield',
    icon: 'shield',
    badge: 'CR 702',
    sections: [
      {
        heading: 'Deathtouch + Trample (CR 702.2c & 702.19b)',
        description: 'A creature with both Deathtouch and Trample only needs to assign 1 point of combat damage to each blocking creature (since any damage from Deathtouch is lethal). All remaining damage tramples over directly to the defending player or planeswalker, even if the blocker has Indestructible or 20 toughness!',
      },
      {
        heading: 'Indestructible vs -X/-X vs Sacrifice (CR 702.12b & 704.5f)',
        description: 'Indestructible only protects against lethal combat damage and effects that say "destroy". It does NOT protect against:',
        items: [
          {
            term: '-X/-X Toughness Reduction',
            details: 'If a creature toughness becomes 0 or less (e.g. Toxic Deluge, Elesh Norn), it is placed directly into the graveyard by State-Based Action 704.5f. Indestructible cannot prevent this.',
            crCode: 'CR 704.5f',
          },
          {
            term: 'Sacrifice Effects',
            details: 'Sacrificing a permanent is not destruction. An Indestructible creature must be sacrificed if targeted by edict effects (e.g. Sheoldred Edict).',
            crCode: 'CR 701.17a',
          },
          {
            term: 'Exile',
            details: 'Exile moves the card to the exile zone without destroying it (e.g. Swords to Plowshares, Farewell).',
            crCode: 'CR 701.8',
          },
        ],
      },
      {
        heading: 'Ward vs Hexproof vs Shroud (CR 702.21 & 702.11)',
        description: 'Comparison of targeting protection mechanics:',
        items: [
          {
            term: 'Hexproof',
            details: 'Cannot be the target of spells or abilities controlled by opponents. You can still target your own permanents.',
            crCode: 'CR 702.11',
          },
          {
            term: 'Shroud',
            details: 'Cannot be the target of spells or abilities by ANY player, including its controller.',
            crCode: 'CR 702.18',
          },
          {
            term: 'Ward [Cost]',
            details: 'A triggered ability! Opponents CAN target it. When targeted, Ward triggers and counters the spell unless opponent pays [Cost]. Spells that "cannot be countered" bypass Ward cost.',
            crCode: 'CR 702.21',
          },
        ],
      },
      {
        heading: 'First Strike vs Double Strike (CR 702.7 & 702.4)',
        description: 'Combat damage timing breakdown:',
        items: [
          {
            term: 'Combat Step Creation',
            details: 'If any creature has First Strike or Double Strike, an initial combat damage step is created. Only creatures with First or Double Strike assign damage in this step.',
            crCode: 'CR 702.7b',
          },
          {
            term: 'Second Damage Step',
            details: 'Surviving creatures without First Strike, plus all creatures with Double Strike, assign damage in the second combat damage step.',
            crCode: 'CR 702.4b',
          },
        ],
      },
      {
        heading: 'Mutate Mechanics & Rules (CR 702.140)',
        description: 'Key interactions when mutating creature spells:',
        items: [
          {
            term: 'Targeting & Fizzle',
            details: 'Mutate targets a non-Human creature you own. If the target leaves the battlefield before the mutate spell resolves, the mutate spell resolves as a normal creature spell instead of fizzling!',
            crCode: 'CR 702.140b',
          },
          {
            term: 'Combined Characteristics',
            details: 'The top card determines name, power, toughness, mana cost, and types. The merged permanent gains all abilities from every card in the pile.',
            crCode: 'CR 702.140e',
          },
          {
            term: 'Commander Identity & Damage',
            details: 'If your Commander is anywhere in the mutated pile (top or bottom), the entire merged permanent deals Commander combat damage.',
            crCode: 'CR 903.3c',
          },
        ],
      },
      {
        heading: 'Storm & Cascade Cast Triggers (CR 702.40 & 702.85)',
        description: 'Resolution of copies and exiled cards upon casting:',
        items: [
          {
            term: 'Storm Copies on the Stack',
            details: 'Storm is a cast trigger! Countering the original Storm spell does NOT prevent the copies from being put onto the stack. Each copy must be countered individually (or via Flusterstorm/Whirlwind Denial).',
            crCode: 'CR 702.40a',
          },
          {
            term: 'Cascade Mana Value',
            details: 'Cascade checks mana value strictly lower than the spell cast. The free spell is cast from exile and can be responded to, countered, or triggers cast triggers.',
            crCode: 'CR 702.85a',
          },
        ],
      },
      {
        heading: 'Toxic vs Infect vs Wither (CR 702.164, 702.90 & 702.80)',
        description: 'Differences in dealing damage and applying poison:',
        items: [
          {
            term: 'Infect',
            details: 'Deals damage to creatures in the form of -1/-1 counters, and to players in the form of poison counters (replaces normal life loss completely).',
            crCode: 'CR 702.90',
          },
          {
            term: 'Toxic N',
            details: 'Deals regular combat damage (player loses life normally) AND gives defending player N poison counters simultaneously. Combat damage is not replaced.',
            crCode: 'CR 702.164',
          },
          {
            term: '10 Poison Loss SBA',
            details: 'A player with 10 or more poison counters loses the game as a State-Based Action. Damage prevention stops Toxic/Infect from applying poison.',
            crCode: 'CR 704.5c',
          },
        ],
      },
    ],
  },
  {
    id: 'layers_system',
    title: 'The 7 Layers System',
    subtitle: 'The exact order continuous effects apply to permanents in MTG',
    icon: 'layers',
    badge: 'CR 613',
    sections: [
      {
        heading: 'Comprehensive Rules 613 Ordering',
        description: 'Continuous effects are applied in layer order (1 through 7). Effects in earlier layers apply before effects in later layers, regardless of timestamp.',
        items: [
          {
            term: 'Layer 1: Copy Effects',
            details: 'Clone, Copy tokens, and Mutate characteristics. Applies the base printed card values.',
            crCode: 'CR 613.1a',
          },
          {
            term: 'Layer 2: Control Changing',
            details: 'Effects that change who controls a permanent (e.g. Act of Treason, Control Magic).',
            crCode: 'CR 613.1b',
          },
          {
            term: 'Layer 3: Text Changing',
            details: 'Effects that alter the text of a card (e.g. Mind Bend, Magical Hack).',
            crCode: 'CR 613.1c',
          },
          {
            term: 'Layer 4: Type Changing',
            details: 'Subtypes, card types, and supertypes (e.g. Blood Moon turning nonbasic lands into Mountains, Dryad of the Ilysian Grove).',
            crCode: 'CR 613.1d',
          },
          {
            term: 'Layer 5: Color Changing',
            details: 'Effects that give or remove colors (e.g. Painter Servant, Darkest Hour).',
            crCode: 'CR 613.1e',
          },
          {
            term: 'Layer 6: Ability Adding & Removing',
            details: 'Effects that grant or remove abilities (e.g. Archetype of Courage, Humility removing all creature abilities).',
            crCode: 'CR 613.1f',
          },
          {
            term: 'Layer 7: Power & Toughness Modifiers',
            details: 'Divided into 5 sublayers applied strictly in order: 7a -> 7b -> 7c -> 7d -> 7e.',
            crCode: 'CR 613.4',
          },
        ],
      },
      {
        heading: 'Sublayers of Layer 7 (P/T Order)',
        description: 'Calculates the final Power and Toughness of every creature:',
        items: [
          {
            term: '7a: Characteristic Defining (CDA)',
            details: 'Sets printed star/star power (e.g. Tarmogoyf, Lord of the Unreal).',
            crCode: 'CR 613.4a',
          },
          {
            term: '7b: Setting to Specific Number',
            details: 'Effects that set base P/T to specific values (e.g. Humility sets to 1/1, Oko turns into 3/3 Elk).',
            crCode: 'CR 613.4b',
          },
          {
            term: '7c: Non-counter Modifications',
            details: 'Buffs and debuffs that add or subtract P/T (e.g. Giant Growth +3/+3, Disfigure -2/-2).',
            crCode: 'CR 613.4c',
          },
          {
            term: '7d: Counters (+1/+1, -1/-1)',
            details: 'All counters that modify power and toughness apply here after base values and continuous buffs.',
            crCode: 'CR 613.4d',
          },
          {
            term: '7e: Switching P/T',
            details: 'Effects that switch power and toughness (e.g. Inside Out, Wandering Fumarole). Always applies last!',
            crCode: 'CR 613.4e',
          },
        ],
      },
    ],
  },
  {
    id: 'stack_and_priority',
    title: 'The Stack & Priority',
    subtitle: 'How spells resolve, timing rules & State-Based Actions',
    icon: 'list',
    badge: 'CR 117',
    sections: [
      {
        heading: 'How the Stack Resolves (LIFO)',
        description: 'The stack works on Last In, First Out (LIFO). The most recently cast spell or ability resolves first. When a player casts a spell or activates an ability, it goes to the top of the stack. All players must pass priority in succession for the top item on the stack to resolve.',
      },
      {
        heading: 'Passing Priority & Active Player (APNAP)',
        description: 'Active Player, Non-Active Player order:',
        items: [
          {
            term: 'Priority Holding',
            details: 'The player casting a spell retains priority by default, but must explicitly announce they are holding priority to add another spell/ability before opponents can respond.',
            crCode: 'CR 117.3c',
          },
          {
            term: 'APNAP Trigger Order',
            details: 'If multiple triggers go on the stack at the same time, Active Player puts their triggers on the stack first in any order, then Non-Active Players in turn order. Because of LIFO, the Non-Active Player triggers resolve first!',
            crCode: 'CR 101.4',
          },
          {
            term: 'State-Based Actions (SBA)',
            details: 'Game checks performed automatically whenever a player would receive priority: 0 or less life loses game, 0 toughness creature put in graveyard, legend rule checks. SBAs do not use the stack and cannot be responded to.',
            crCode: 'CR 704',
          },
        ],
      },
    ],
  },
  {
    id: 'state_based_actions',
    title: 'State-Based Actions & Legend Rule',
    subtitle: 'Automatic game rules checked simultaneously before priority: SBA 704 & Legend Rule',
    icon: 'zap',
    badge: 'CR 704',
    sections: [
      {
        heading: 'The Legend Rule (CR 704.5j)',
        description: 'If a player controls two or more legendary permanents with the same name, that player chooses one of them, and the rest are put into their owners graveyards immediately. This is not a sacrifice, cannot be responded to, and triggers "dies" triggers.',
        items: [
          {
            term: 'No Priority Window',
            details: 'Players cannot activate abilities or cast spells between the second legend entering the battlefield and the choice being made.',
            crCode: 'CR 704.5j',
          },
          {
            term: 'Opponents Controls Same Legend',
            details: 'The Legend Rule only checks per player. Both you and your opponent can control the same legendary permanent (e.g. Sheoldred) with no conflict.',
            crCode: 'CR 704.5j',
          },
        ],
      },
      {
        heading: 'Lethal Damage vs 0 Toughness (CR 704.5f & 704.5g)',
        description: 'Crucial distinction between damage destruction and zero toughness:',
        items: [
          {
            term: '0 or Less Toughness (CR 704.5f)',
            details: 'A creature with 0 or less toughness is put into its owner graveyard. Indestructible does NOT save it, nor does regenerating it.',
            crCode: 'CR 704.5f',
          },
          {
            term: 'Lethal Marked Damage (CR 704.5g)',
            details: 'A creature with damage marked on it greater than or equal to its toughness is destroyed. Indestructible prevents this destruction.',
            crCode: 'CR 704.5g',
          },
        ],
      },
      {
        heading: 'Counters & Permanents Cleanup',
        description: 'Other universal SBAs running constantly in the background:',
        items: [
          {
            term: '+1/+1 and -1/-1 Annihilation',
            details: 'If a permanent has both +1/+1 counters and -1/-1 counters on it, an SBA cancels them out 1-for-1 until only one counter type remains.',
            crCode: 'CR 704.5q',
          },
          {
            term: 'Unattached Auras (CR 704.5m)',
            details: 'If an Aura is attached to an illegal object or not attached to anything, it is put into its owner graveyard as an SBA.',
            crCode: 'CR 704.5m',
          },
          {
            term: 'Planeswalker 0 Loyalty (CR 704.5i)',
            details: 'If a planeswalker has 0 loyalty counters, it is put into its owner graveyard immediately as an SBA.',
            crCode: 'CR 704.5i',
          },
        ],
      },
    ],
  },
  {
    id: 'fizzle_and_replacements',
    title: 'Resolution, Fizzling & Replacements',
    subtitle: 'What happens when targets become illegal, and how replacement effects work',
    icon: 'refresh-cw',
    badge: 'CR 608 / 614',
    sections: [
      {
        heading: 'Illegal Targets & "Fizzling" (CR 608.2b)',
        description: 'How a spell resolves if some or all of its targets become illegal:',
        items: [
          {
            term: 'ALL Targets Illegal (Spell Fizzles)',
            details: 'If EVERY target of a spell or ability is illegal upon resolution, the spell doesn not resolve at all. It is removed from the stack and put into the graveyard. None of its secondary effects happen (e.g. "draw a card" does not occur).',
            crCode: 'CR 608.2b',
          },
          {
            term: 'AT LEAST ONE Target Still Legal',
            details: 'If at least one target remains legal, the spell DOES resolve! It does as much as it can to legal targets, and non-targeted instructions (like drawing a card or gaining life) still happen fully.',
            crCode: 'CR 608.2b',
          },
        ],
      },
      {
        heading: 'Replacement Effects (CR 614)',
        description: 'Continuous effects that modify how an event occurs before it actually happens:',
        items: [
          {
            term: 'Key Identification Word: "INSTEAD"',
            details: 'Replacement effects contain words like "instead", "as enters", or "skips". They do NOT use the stack and cannot be responded to.',
            crCode: 'CR 614.1a',
          },
          {
            term: 'Who Chooses the Order?',
            details: 'If two or more replacement effects want to modify the same event, the affected player (or the controller of the affected object) decides the order to apply them.',
            crCode: 'CR 616.1',
          },
          {
            term: 'Rest in Peace vs Dies Triggers',
            details: 'Replacement effects like Rest in Peace exile cards INSTEAD of going to graveyard. Therefore, "dies" or "when put into a graveyard" triggers never trigger!',
            crCode: 'CR 614.6',
          },
        ],
      },
    ],
  },
  {
    id: 'commander_rules',
    title: 'Commander Specific Rules',
    subtitle: 'Commander Tax, 21 Combat Damage, Color Identity & Command Zone Transitions',
    icon: 'award',
    badge: 'CR 903',
    sections: [
      {
        heading: 'Commander Damage Rule (CR 903.10)',
        description: 'A player that has been dealt 21 or more combat damage by the same commander over the course of the game loses the game as a State-Based Action.',
        items: [
          {
            term: 'Combat Damage Only',
            details: 'Only combat damage dealt by the commander counts. Non-combat damage (e.g. Purphoros or Niv-Mizzet triggers) does NOT count toward the 21.',
            crCode: 'CR 903.10a',
          },
          {
            term: 'Tracked Per Commander',
            details: 'Damage from different commanders does NOT combine (Partner commanders are tracked separately: 15 from one and 6 from another does not eliminate a player). Life gain does NOT reduce commander damage taken.',
            crCode: 'CR 903.10',
          },
        ],
      },
      {
        heading: 'Commander Tax & Casting (CR 903.8)',
        description: 'Each time you cast your commander from the command zone, it costs an additional {2} for each previous time you cast it from the command zone this game.',
        items: [
          {
            term: 'Additional Cost Calculation',
            details: 'Commander tax is an additional cost. It is applied after alternative casting costs (like Fist of Suns or Omniscience) are calculated.',
            crCode: 'CR 903.8',
          },
          {
            term: 'Casting From Other Zones',
            details: 'Casting your commander from hand, graveyard, or exile does NOT incur commander tax, and does not increase future commander tax.',
            crCode: 'CR 903.8',
          },
        ],
      },
      {
        heading: 'Zone-Change Destination Rule (CR 903.9)',
        description: 'What happens when your commander leaves the battlefield:',
        items: [
          {
            term: 'Graveyard or Exile (SBA Check)',
            details: 'Your commander DOES briefly touch the graveyard or exile! "Dies" triggers DO trigger. Then, when SBAs are checked immediately after, its owner may choose to move it to the Command Zone.',
            crCode: 'CR 903.9a',
          },
          {
            term: 'Hand or Library (Replacement Effect)',
            details: 'If your commander would be put into your hand or library, its owner may choose to put it into the Command Zone INSTEAD as a replacement effect (never touches the library).',
            crCode: 'CR 903.9b',
          },
        ],
      },
    ],
  },
];
