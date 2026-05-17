# Dream Duels: Quick Reference

> Full rules: [rules.md](./rules.md) (EN) · [rules.ja.md](./rules.ja.md) (JA)

## Win Condition

Last surviving team wins. A team is eliminated when **all** its members
have 0 Life Tokens.

## Phase Order (every round)

1. **Battle** — encounters, card reveal, damage
2. **Forbidden Area** — GM draws 2 cards → new forbidden cell
3. **Movement** — GM draws 1 card (movement attribute) → teams move or rotate
4. **Revival** — recover dropped Life Tokens from your coordinate

## Three-Way Chart

```text
Fire → Wood → Water → Fire (cycle)
Joker beats everything
Same element = draw
```

| A plays | B plays | Result |
| --- | --- | --- |
| Fire | Wood | A wins |
| Wood | Water | A wins |
| Water | Fire | A wins |
| Fire | Fire | Draw |
| — | — | Card-absence: card-holder wins |
| Joker | Any | Joker wins |
| Joker | Joker | Draw |

## Damage Points

| Condition | Points |
| --- | --- |
| Base (won the RPS) | 1 |
| Facing bonus: not perpendicular + same cell | +1 |
| Facing bonus: not perpendicular + facing toward + adjacent | +1 |
| Bonus: winner value ≥ 2× loser | +1 |
| Bonus: winner = 13, loser 7–10 | +1 |
| Bonus: winner ≤ 2, loser ≥ 11 | +1 |
| Penalty: inverse of bonus conditions | −1 |
| Joker win or card-absence win | Fixed 1 (skip all above) |
| Draw | 0 each |

Damage cannot go below 0.

## Life Token Limits

- Maximum per player: **4** (3 for solo-team players)
- Tokens dropped on your coordinate when you take damage
- Revival: recover 1 dropped token under certain conditions
- Solo team starts with **3** tokens (high-risk, high-reward)

## Movement Rules

- **Card matches movement attribute** → advance 1 cell in current facing direction
- **Card does not match** → rotate piece to the orientation shown on the card
- **Off-grid or forbidden coordinate** → lose 1 Life Token
  (self-elimination, no card theft)
- Maximum of **4** Life Tokens per player after Revival charging

## Coordinate System

The 3×3 grid has Fire, Water, Wood on each axis.
Your piece shows the **number token** (team ID) + **2 attribute cards**
(facing = card orientation).

## Card Types

| Card | Special rule |
| --- | --- |
| Attribute (1–13) | Normal play; value affects damage bonus/penalty |
| Joker | Beats any attribute; fixed 1 damage; counts as 25 for encounter order |
