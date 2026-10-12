# Mathematical analysis specification

## Authorized outcome

Implement the user's 2026-10-12 mission: an independent, reproducible offline
solver and simulator for all nine configurations, an evidence-based balancing
report, regression tests, and a pull request with green CI. No merge.

Baseline checked live: `b8959e247b8a44217d470cc6bfd9c6d01be2b42a`.
No overlapping branches or open PRs at reconnaissance. Editorial source:
https://docs.google.com/document/d/1e97gYlZ-yRZGhjnrtOmEMMaIZ2JSoeUdYDbn13wMte0/edit

## Constraints

- Node.js 24 and built-in modules only; no runtime dependencies or backend.
- Preserve all nine levels, names, order, copy, and narrative in `data.js`.
- Preserve public rules: distinct decimal digits (leading zero allowed),
  lengths 4/5/7, seven guesses, three feedback modes.
- Gameplay fixes require a demonstrated defect and a regression; balancing
  recommendations remain proposals.
- Keep all development on `analysis/mathematical-solver-balance`.
- Complete ordinary implementation choices autonomously as explicitly requested.

## Architecture

The game engine keeps the secret in a closure. Its only response is a public
observation: attempt number, feedback, won, terminal. It never reveals which
digit the cryptic selector chose. The terminal loss epilogue's secret disclosure
is deliberately excluded from pre-disclosure candidate metrics.

The solver receives public observations only, maintains hypotheses, and never
imports the game engine. Exhaustive candidate filtering is practical for
10P4=5,040, 10P5=30,240, 10P7=604,800. Packed codes and typed arrays bound memory.
Each hypothetical code determines its own confirmed-digit mask and hint cache;
the likelihood of a first hint is 1/(number of matching catalog entries), and a
cached repeat has likelihood zero or one. Filtering is exact up to floating
point arithmetic. No sampled true-secret insertion or fallback is permitted.

Guess selection compares uniform valid guesses, uniform surviving candidates,
an expected-compatible-count heuristic, and sampled one-step mutual information. Entropy must
subtract conditional hint randomness in cryptic mode. These are policies, not
proofs of optimal seven-turn play. Explicit deterministic sample/work limits
bound scoring; deadlines abort experiments, never silently change policies.

## Evidence

Test generation, validity, source parity, cryptic state/cache likelihoods,
observation boundary, seed reproducibility, terminal handling and exhaustive
small spaces. Use independent browser-source tests, not only a copy of the
new model. Report all nine configurations in campaign order and compare
strategies on matched trial seeds. Save per-game results, distributions,
residual candidate counts, wins with Wilson 95% intervals, losses, runtime,
memory and reproducible commands. Clearly distinguish proofs from simulations.

## Completion

Run the existing checks and the new test suite locally before one coherent
push; open the PR and inspect CI on its exact head. Update the existing Trello
card from observed state. No Calendar action is required for this mission.
