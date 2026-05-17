# ⚔️ Dream Duels: The Battle for Oneiron — Rules

> **Note**: The [Japanese canonical version](./rules.ja.md) is the
> authoritative source. This English translation is provided for
> reference.

## Contents

1. [Overview](#overview)
2. [Story](#story)
3. [Game Overview](#game-overview)
4. [Items](#items)
5. [Game Flow](#game-flow)
6. [Variables](#variables)

---

## Overview

This document records the game rules for *Dream Duels: The Battle for
Oneiron*, a new table-talk battle-royale card game. It serves as both
a design document and a specification.

## Story

Without warning, the players find themselves drawn into a fantastical
dream world called **Oneiron**. In this mystical realm, an astonishing
power to manipulate dreams awakens, and miracles impossible in the real
world begin to occur. Yet this beautiful world is haunted by the evil
Nightmare King **Nocturne** and his minions, who scheme to seize
control of Oneiron.

The mysterious guardian of Oneiron, **Lucid**, recognises that the
players are the destined warriors who will save this world. Lucid
grants them the power of **Dream Walkers** — heroes who wield the
force of dreams — and entrusts them with the mission of restoring
peace to Oneiron. But Lucid lacks the strength to grant everyone full
power at once, and doubts whether the players can master these
abilities. Lucid therefore decides to put the players to a trial.

Lucid grants each player temporary power and sets them against one
another, seeking to find the mightiest warriors. Those who survive
will be granted true power and entrusted with the mission of saving
Oneiron as genuine Dream Walkers. Players — the battle for the fate
of Oneiron begins. Become the greatest Dream Walker and protect this
beautiful dream world!

## Game Overview

### Player Count

- Recommended: 6–12 players. Up to 2–20 players are theoretically
  possible.
- Additionally, 1 Game Master (who may also be a player).

### Play Time

- With 10–12 players, mostly inexperienced: approximately 2.5 hours.
- With the same number of experienced players playing efficiently:
  approximately 40 minutes.

### Game Features

- A team duel based on a three-way rock-paper-scissors system, using
  only a small number of item types.
- Battle-royale gameplay in which teams of 2 players compete until
  only one remains.
- The last surviving team wins.

## Items

- Cards
  - Attribute cards: {3 × 13 × A} total
    - Fire, Water, Wood — equal numbers of each, forming a three-way
      superiority cycle.
    - Each attribute card bears a value from 1 to 13.
  - Joker cards: 2
- Tokens
  - Number tokens: up to 10
    - Numbered 1–10, one per team; should be made of heavy material
      (like a medal). An underline distinguishes 6 from 9.
  - Life tokens: up to 40

## Game Flow

- Round 0 is performed only once at the start and does not repeat.
- Steps marked **(Optional)** may be skipped when all players are
  experienced.
- Steps marked **(Consensus)** are not governed by the rules; any
  method agreed upon by the participants (volunteers, rock-paper-
  scissors, drawing lots, etc.) is acceptable.

### Round 0

Round 0 consists of two phases: **Setup** and **Descent**.

#### Round 0: Setup Phase

Teams are formed and initial items are distributed during this phase.

1. **(Consensus)** Players select one person to serve as Game Master.
   The GM may also be a player.
2. Players **(Consensus)** form pairs to create 2-player teams.
   - If the total is odd, one Solo Team will exist.
   - **(Optional)** If a Solo Team may occur, the GM explains that
     playing solo is a high-risk, high-reward choice.
3. In parallel with step 2, the GM draws from the attribute card deck
   {(number of teams × B) + 2} cards of each attribute, plus 1 Joker
   card, and shuffles the rest back into the deck.
   - Set aside 2 cards of each of the 3 attributes drawn; these are
     kept for the Descent phase.
4. Once steps 2–3 are complete, the GM distributes the following to
   each team:
   1. 1 Number Token. The number printed on this token is the team
      number.
   2. 4 Life Tokens. (Solo Teams receive 3.)
   3. The drawn attribute cards, revealed, with B cards of each
      attribute per team.
   4. C cards dealt face-down from the deck, distributed equally.
   5. (Solo Teams only) 1 Joker card.
5. Each team distributes the received Life Tokens equally among its
   members. A Solo Team player keeps all of them.

#### Round 0: Descent Phase

Initial positions for each team are determined during this phase.

1. **(Optional)** The GM declares the game open and reads the story
   aloud.
2. To determine where each team lands, the GM takes the set-aside
   classified attribute cards and creates 2 sets of 3 unique cards
   each.
3. Each set is shuffled and placed face-down along the horizontal and
   vertical axes of the play area, forming a 3×3 grid. The grid is
   set up with padding equal to one card width.
4. In parallel with steps 2–3, each team selects 2 attribute or Joker
   cards from their hand and submits them face-down.
   - The two attribute cards must be placed side by side, face-down.
   - Cards may be oriented in any of the 4 directions. This
     orientation becomes the team's initial facing.
   - Both cards must share the same orientation.
5. Once steps 3 and 4 are complete, the GM reveals the attribute cards
   along the grid axes. The attribute of each revealed card becomes
   that axis's coordinate.
6. On the GM's signal, all teams reveal their submitted attribute
   cards simultaneously. The card on a player's left becomes the
   horizontal (x) coordinate, the other becomes the vertical (y)
   coordinate. A Joker card lets the team freely choose the coordinate
   for that axis.
7. Each team stacks their submitted attribute cards, places them at
   the matching coordinate while maintaining orientation, and weighs
   the stack down with their Number Token to prevent sliding. This
   becomes the team's starting position; the card orientation is the
   team's facing. From this point on, the cards and token serve as
   the team's piece.

### Round 1 Onwards

- Each round has 4 phases: **Battle**, **Forbidden Area**,
  **Movement**, and **Revival**.
- These phases repeat each round from this point on.
- The game ends immediately when only 1 team survives; that team wins.

#### Battle Phase

1. Encounters are established in the following order:
   1. **Same coordinate**: Teams whose attribute-card pair totals are
      lowest encounter in ascending order.
      - Example: if pair totals for all teams are 2, 4, 5, 7, and 9,
        then 2 vs 4 and 5 vs 7 are encounters; 9 is next-in-line and
        does not encounter.
      - A Joker counts as value 25.
   2. **Adjacent coordinate**: Teams that did not encounter in (i)
      and are in adjacent cells encounter.
   3. Teams that match neither condition do not encounter.
2. Within the team, members **(Consensus)** divide the hand of
   attribute cards among themselves. Once divided, redistribution is
   forbidden until the end of the Battle Phase, except when one
   member runs out of cards.
3. Face your opponents. If both teams have 2 living members, decide
   1-vs-1 matchups **(Consensus)**. Otherwise the matchup is
   automatically 1-vs-1 or 1-vs-2.
4. The team with the lower pair-card total attacks first. If equal,
   decide **(Consensus)**.
5. The attacking team places 1 attribute card face-down. If out of
   cards, a teammate may lend one as an exception; if no cards
   remain at all, the team forfeits.
6. The defending team does the same as step 5.
7. Both teams reveal cards simultaneously. The three-way cycle is
   Fire beats Wood, Wood beats Water, Water beats Fire.
   - Joker wins unconditionally.
   - If only one side plays a card, the side with the card wins.
   - If neither side plays a card, it is a draw.
   - In a 1-vs-2 situation, the two-player team has each member
     judged individually.
8. Damage points are calculated from card facing and value:
   - The winner earns **1 base point**, plus **+1** if either of the
     following applies:
     - Facings are **not perpendicular** AND teams are at the
       **same coordinate**.
     - Facings are **not perpendicular** AND the winner is **facing
       toward the opponent** AND teams are at **adjacent
       coordinates**.
   - After the base points, bonus and penalty points are calculated:
     - **Bonus (+1)** if any of the following:
       - Winner's card value is ≥ 2× the loser's value.
       - Winner's card is 13 and loser's card is 7–10.
       - Winner's card is ≤ 2 and loser's card is ≥ 11.
     - **Penalty (−1)** if the inverse conditions apply.
     - **Exception**: A Joker win or a card-absence win skips all
       point calculations and returns a fixed **1 point**.
   - A draw gives both sides **0 points**.
9. The calculated damage points are settled against the opponent's
   Life Tokens:
   - Life Tokens removed as damage are dropped at the team's current
     coordinate.
   - In a 1-vs-2 situation, each member of the 2-player team is
     judged and settled individually.
   - A player whose Life Tokens reach 0 is temporarily eliminated.
   - A player who takes all of an opponent's Life Tokens may choose
     1 card from the opponent's revealed hand and take it; the rest
     go to the surviving team members.
   - If the damage exceeds the available Life Tokens, the excess is
     settled by taking E× (value TBD) of the opponent's attribute
     cards; the rest go to survivors.
   - When all members of a team have 0 Life Tokens, the team is
     defeated. They remove their Number Token and all their attribute
     cards from the grid and discard them to the graveyard.
     - Eliminated Number Tokens are arranged in order; a team's rank
       is {total teams − arrival order + 1}.
10. Cards used in combat cannot be reused and are discarded to the
    graveyard.

#### Forbidden Area Phase

1. The GM draws 2 attribute cards from the deck and reveals them
   immediately. The first card gives the horizontal coordinate and the
   second gives the vertical coordinate of the new forbidden cell.
2. The GM stacks the two drawn cards face-down and places them
   sideways at the new forbidden-cell coordinate. If already
   forbidden, they are stacked on top. This marker designates the
   forbidden area.

#### Movement Phase

1. The GM draws 1 attribute card from the deck and reveals it
   immediately. This card's attribute is the **movement attribute**
   for this round.
2. Each team merges the attribute cards that were split among members
   during the Battle Phase.
3. Each team **(Consensus)** selects 1 attribute card for movement
   and submits it face-down. The card may be oriented in any of the
   4 directions.
   - If a team has no cards in hand, they draw 2 from the deck, use
     1 for movement, and keep the other.
4. Once all teams have submitted, the GM signals and all teams reveal
   their cards simultaneously. Facing must not change during
   revelation.
5. Movement proceeds according to the revealed attribute:
   - **Movement attribute**: ignore step 3's orientation and advance
     the team piece (card + Number Token) 1 cell in the current
     facing direction of the piece already on the grid.
   - **Other attribute**: rotate the piece already on the grid to
     match the orientation chosen in step 3.
6. Each team may replace any 1 of their attribute cards on the grid
   with the card just played; the old card is discarded to the
   graveyard.
7. Once all movement is complete, forbidden-area penalties are
   applied. Any team on a forbidden coordinate or outside the grid
   forfeits 1 Life Token.
   - The team decides **(Consensus)** which member pays.
   - If the paying member's tokens reach 0, the same rules as the
     Battle Phase apply, except no card theft occurs (self-
     elimination).

#### Revival Phase

1. A team may recover 1 Life Token from their current coordinate if
   any tokens were dropped there AND one of the following applies:
   - No other team occupies the same coordinate, or all such teams
     have already been eliminated.
   - Another team occupies the same coordinate but was not scheduled
     to encounter (waited in queue without an established match).
2. Recovered Life Tokens may be used for:
   - **Reviving a fallen member**: assign the token directly to the
     eliminated player, who returns with 1 life. As a bonus, that
     player also draws 1 new attribute card from the deck.
   - **Charging life**: assign the token directly to one's own life,
     up to a maximum of 4.
   - **Charging cards**: draw 3 new attribute cards from the deck.

## Variables

### Definitions

| Variable | Meaning |
| --- | --- |
| A | Number of duplicate copies of each identical attribute card |
| B | Multiplier on team count when extracting attribute cards from the deck |
| C | Number of random attribute cards dealt equally to each team |
| D | Time limit for a single Battle Phase (in minutes) |
| E | Multiplier for the number of attribute cards seized when life cannot cover damage |
