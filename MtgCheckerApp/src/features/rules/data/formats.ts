export type FormatKeyRule = {
  title: string;
  description: string;
  crCitation: string;
};

export type FormatRule = {
  id: string;
  name: string;
  badge: string;
  icon: string;
  summary: string;
  startingLife: number;
  minDeckSize: number;
  maxDeckSize?: number | null;
  keyRules: FormatKeyRule[];
  displayOrder: number;
};

export const FORMAT_RULES: FormatRule[] = [
  {
    id: 'commander',
    name: 'Commander / EDH',
    badge: 'CR 903',
    icon: 'award',
    summary: 'A 100-card multiplayer singleton format where decks are led by a legendary Commander.',
    startingLife: 40,
    minDeckSize: 100,
    maxDeckSize: 100,
    displayOrder: 1,
    keyRules: [
      {
        title: '100-Card Singleton',
        description: 'Exactly 100 cards including commander(s). No duplicate cards allowed except basic lands.',
        crCitation: 'CR 903.5a, CR 903.5b',
      },
      {
        title: 'Color Identity',
        description: "Every card in the deck must contain only mana symbols found within the commander's color identity (mana cost + rules text).",
        crCitation: 'CR 903.4',
      },
      {
        title: 'Commander Damage (21)',
        description: 'A player dealt 21 or more combat damage by a single commander over the game loses immediately as a State-Based Action.',
        crCitation: 'CR 903.10a, CR 704.5j',
      },
      {
        title: 'Commander Tax (+{2})',
        description: 'Casting your commander from the command zone costs an additional {2} generic mana for each previous time cast from there.',
        crCitation: 'CR 903.8',
      },
      {
        title: 'Free First Mulligan',
        description: "In multiplayer games, each player's first mulligan is completely free (draw 7 without tucking a card to bottom).",
        crCitation: 'CR 103.5c, CR 800.6',
      },
      {
        title: 'Command Zone SBA',
        description: 'When a commander enters the graveyard or exile, its owner may choose to move it to the command zone as a State-Based Action.',
        crCitation: 'CR 903.9a',
      },
      {
        title: 'No Sideboard',
        description: 'Commander games do not use sideboards, and effects that bring cards from outside the game cannot bring cards in.',
        crCitation: 'CR 903.5e, CR 903.11',
      },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: 'CR 100.2',
    icon: 'zap',
    summary: 'Dynamic 60-card constructed format using premier expansions from the past three years.',
    startingLife: 20,
    minDeckSize: 60,
    maxDeckSize: null,
    displayOrder: 2,
    keyRules: [
      {
        title: '60-Card Minimum',
        description: 'Decks must have at least 60 cards. Up to 4 copies of any nonbasic card are allowed.',
        crCitation: 'CR 100.2a',
      },
      {
        title: '15-Card Sideboard',
        description: 'Optional sideboard of up to 15 cards for best-of-three match play.',
        crCitation: 'CR 100.4a',
      },
      {
        title: '3-Year Rotation',
        description: 'Constructed format using premier sets released in the past 3 years.',
        crCitation: 'CR 206.4',
      },
      {
        title: 'London Mulligan',
        description: 'Draw 7 cards, then put cards on bottom of library equal to mulligan count.',
        crCitation: 'CR 103.5',
      },
    ],
  },
  {
    id: 'modern',
    name: 'Modern',
    badge: 'CR 100.2',
    icon: 'shield',
    summary: 'Popular non-rotating constructed format spanning sets from 2003 to present.',
    startingLife: 20,
    minDeckSize: 60,
    maxDeckSize: null,
    displayOrder: 3,
    keyRules: [
      {
        title: '60-Card Minimum',
        description: 'Decks must have at least 60 cards. Up to 4 copies of any nonbasic card.',
        crCitation: 'CR 100.2a',
      },
      {
        title: 'Non-Rotating Pool',
        description: 'All core and expansion sets since Eighth Edition (2003) plus Modern Horizons series.',
        crCitation: 'CR 206.4',
      },
      {
        title: '15-Card Sideboard',
        description: 'Up to 15 cards used to swap between games in a match.',
        crCitation: 'CR 100.4a',
      },
    ],
  },
  {
    id: 'two_headed_giant',
    name: 'Two-Headed Giant (2HG)',
    badge: 'CR 810',
    icon: 'users',
    summary: 'Multiplayer variant where two teams of two players share life and combat turns.',
    startingLife: 30,
    minDeckSize: 60,
    maxDeckSize: null,
    displayOrder: 4,
    keyRules: [
      {
        title: 'Shared 30 Life',
        description: 'Teams start with a shared total of 30 life. Damage and life loss apply to the team total.',
        crCitation: 'CR 810.4, CR 810.9',
      },
      {
        title: '15 Poison Counters',
        description: 'Teams lose as a state-based action upon accumulating 15 total poison counters.',
        crCitation: 'CR 810.8d, CR 810.10',
      },
      {
        title: 'Shared Turn & Combat',
        description: 'Team members take turns simultaneously and declare attacking and blocking creatures as a team.',
        crCitation: 'CR 805.4, CR 805.10',
      },
      {
        title: 'Team Priority',
        description: "Teams receive and pass priority as a unit. Teammates may review each other's hands freely.",
        crCitation: 'CR 805.5, CR 809.7',
      },
    ],
  },
];
