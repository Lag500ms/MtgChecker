export type JudgeVerdict = {
  id: string;
  query: string;
  cardNames: string[];
  verdict: 'YES' | 'NO' | 'CONDITIONAL' | string;
  verdictTitle: string;
  summary: string;
  stackSteps: string[];
  crRules: string[];
  category?: string;
  isCached?: boolean;
};

export const QUICK_DISPUTES: JudgeVerdict[] = [
  {
    id: 'doubling_season_pw',
    query: 'Doubling Season + Planeswalker',
    cardNames: ['Doubling Season'],
    verdict: 'YES',
    verdictTitle: 'Planeswalker enters with DOUBLED loyalty counters!',
    summary:
      'A Planeswalker entering the battlefield with starting loyalty counters is treated by the rules as a replacement effect that puts counters on it. Because an effect is placing counters on a permanent under your control, Doubling Season doubles the starting loyalty (e.g. 4 becomes 8). NOTE: Activating a +X loyalty ability is a COST, not an effect, so activating abilities is NOT doubled.',
    stackSteps: [
      '1. Planeswalker spell resolves and enters the battlefield.',
      '2. CR 306.5b applies: It enters with starting loyalty counters.',
      '3. Doubling Season replacement effect replaces N counters with 2N counters.',
      '4. Planeswalker arrives on the battlefield with double starting loyalty ready to ultimate!',
    ],
    crRules: ['CR 306.5b', 'CR 614.1c', 'CR 606.4'],
  },
  {
    id: 'blood_moon_urzas_saga',
    query: "Blood Moon + Urza's Saga",
    cardNames: ['Blood Moon', "Urza's Saga"],
    verdict: 'NO',
    verdictTitle: "Urza's Saga immediately DIES and goes to Graveyard!",
    summary:
      "Blood Moon turns all nonbasic lands into Mountains in Layer 4 (type-changing). Urza's Saga is an Enchantment Land - Saga. Blood Moon removes all of its written abilities and chapter abilities. However, it is STILL a Saga enchantment with lore counters on it. Because it is a Saga with 0 chapter abilities, its maximum chapter number is 0. Since its lore counter count is >= its maximum chapter count (0), State-Based Action 704.5s immediately sacrifices it to the graveyard!",
    stackSteps: [
      '1. Blood Moon applies in Layer 4, making Urza\'s Saga a Mountain with no abilities.',
      '2. Urza\'s Saga retains the Saga subtype and any lore counters on it.',
      '3. Chapter count is now 0. State-Based Action 704.5s checks lore counters >= 0.',
      '4. Urza\'s Saga is placed into the graveyard as a State-Based Action (no trigger, no response possible).',
    ],
    crRules: ['CR 613.1d', 'CR 704.5s', 'CR 714.2d'],
  },
  {
    id: 'deathtouch_trample',
    query: 'Deathtouch + Trample vs Blocker',
    cardNames: [],
    verdict: 'YES',
    verdictTitle: 'Assign ONLY 1 damage to blocker, rest tramples to player!',
    summary:
      'Any amount of damage dealt by a creature with Deathtouch is considered lethal damage (CR 702.2c). Trample allows the attacker to assign lethal damage to each blocker and assign the remainder to the defending player or planeswalker (CR 702.19b). Therefore, you only need to assign exactly 1 point of combat damage to each blocking creature, even if the blocker has 20 toughness or Indestructible! The remaining power deals direct face damage.',
    stackSteps: [
      '1. Attacker is blocked by one or more creatures.',
      '2. In Combat Damage step, attacker assigns 1 damage to first blocker (lethal due to Deathtouch).',
      '3. Any remaining unassigned power is assigned directly to the defending player.',
      '4. Damage resolves simultaneously.',
    ],
    crRules: ['CR 702.2c', 'CR 702.19b', 'CR 510.1c'],
  },
  {
    id: 'teferis_protection_tokens',
    query: 'Teferi\'s Protection + Creature Tokens',
    cardNames: ["Teferi's Protection"],
    verdict: 'YES',
    verdictTitle: 'Tokens DO NOT cease to exist; they phase back in safely!',
    summary:
      'Before Magic 2010 / Commander 2017, phased-out tokens would cease to exist. Under modern Comprehensive Rules 702.26d, creature tokens phase out normally and will phase back in during your next untap step just like non-token permanents! They retain all counters and auras attached to them.',
    stackSteps: [
      '1. Teferi\'s Protection resolves; all your permanents phase out simultaneously.',
      '2. Tokens treat Phased Out status as a continuous state; they are not exiled or sent to graveyard.',
      '3. During your next untap step, all phased-out permanents (including tokens) phase back in simultaneously.',
    ],
    crRules: ['CR 702.26d', 'CR 502.1'],
  },
  {
    id: 'sheoldred_peer_abyss',
    query: 'Sheoldred + Peer into the Abyss',
    cardNames: ['Sheoldred, the Apocalypse', 'Peer into the Abyss'],
    verdict: 'YES',
    verdictTitle: 'Target opponent loses their entire life and dies immediately!',
    summary:
      'Peer into the Abyss causes target player to draw half their library (rounded up) and lose half their life (rounded up). If an opponent has Sheoldred on the battlefield, Sheoldred triggers for EACH card drawn. If opponent draws 40 cards, 40 separate 2-damage triggers go on the stack, dealing 80 damage. Even if they had 100 life, the life loss plus 80 damage instantly reduces life to 0 or less.',
    stackSteps: [
      '1. Peer into the Abyss resolves: opponent draws half their library and loses half their life.',
      '2. Sheoldred triggers once for each card drawn (putting N triggers on the stack).',
      '3. Before triggers even resolve, if opponent had odd life or draws excessive cards, they face devastating damage.',
      '4. Opponent life drops to 0, losing the game via State-Based Action 704.5a.',
    ],
    crRules: ['CR 121.2c', 'CR 603.2', 'CR 704.5a'],
  },
  {
    id: 'indestructible_minus_counters',
    query: 'Indestructible vs -X/-X & -1/-1 Counters',
    cardNames: [],
    verdict: 'NO',
    verdictTitle: 'Indestructible DOES NOT save a creature from 0 toughness!',
    summary:
      'Indestructible only stops effects that use the word "destroy" (like Murder, Wrath of God) and lethal marked combat damage. When a creature\'s toughness is reduced to 0 or less by -X/-X spells (Toxic Deluge, Dismember) or -1/-1 counters, it dies as a State-Based Action (CR 704.5f). It is put directly into the graveyard without being destroyed.',
    stackSteps: [
      '1. Creature receives -X/-X or -1/-1 counters until toughness <= 0.',
      '2. Game checks State-Based Actions before priority is given.',
      '3. CR 704.5f checks toughness <= 0 and moves creature to graveyard.',
      '4. Indestructible has no effect because no destruction occurred.',
    ],
    crRules: ['CR 702.12b', 'CR 704.5f'],
  },
];
