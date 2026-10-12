# Mathematical analysis implementation plan

> **For agentic workers:** Use superpowers:executing-plans. Implementation is
> explicitly authorized in the mission; independent audits run in parallel.

**Goal:** Deliver an observation-only solver, reproducible nine-level comparison,
and tested PR without changing narrative or intended gameplay.

**Architecture:** Separate source-derived public catalog, packed solution space,
private game engine, exact candidate belief, bounded policies, and experiment CLI.

**Tech Stack:** Node.js 24, ECMAScript modules, `node:test`, typed arrays; no packages.

**Spec:** `docs/superpowers/specs/2026-10-12-mathematical-analysis.md`.

## Global Constraints

Node.js 24; no dependencies; 4/5/7 unique decimal digits; seven guesses;
unchanged data.js, HTML, CSS and narrative; dedicated branch, PR, no merge.

## Review Focus

- Cached cryptic hints must not be counted as fresh independent evidence.
- Hint identity and selector priority must not leak the chosen secret digit.
- All candidates, including rare surviving codes, must remain in exact filtering.
- A seventh-turn win is a win; no eighth accepted attempt or post-win mutation.
- Early stopping / compute limits must be visible rather than biasing win rates.

## Task 1: Source parity and gameplay regressions

Files: `test/helpers/browser.mjs`, `test/gameplay.test.mjs`, minimal `script.js` fixes.
Interface: a VM harness exposes source functions and controllable DOM events.
- [x] Reproduce each defect on the baseline before modifying production.
- [x] Add only the minimal rule-preserving fix and run source regressions.
- [x] Verify existing narrative/data checks remain green.

## Task 2: Mathematical model and independent engine

Files: `analysis/catalog.mjs`, `random.mjs`, `core.mjs`, `engine.mjs`, `belief.mjs`,
`test/analysis/model.test.mjs`, `test/analysis/parity.test.mjs`.
Interfaces: `CodeSpace(length, alphabetSize=10)` with `codeAt(id)`, `idOf(code)`;
`createGame({length,mode,secret,rng})` returning only `submit(guess)`;
`Belief(space,mode)` with `observe(guess,observation)`, `count`, `sample(n,rng)`.
- [x] Assert cardinalities, validity, leading zeros, evaluation and reproducibility.
- [x] Assert public-only results, seven-turn boundaries and exact small-space posterior.
- [x] Implement packed enumeration, public feedback codec, private engine and belief.
- [x] Compare model to live browser source over seeded secrets and histories.

## Task 3: Policies and simulation

Files: `analysis/solver.mjs`, `simulate.mjs`, `statistics.mjs`, `test/analysis/solver.test.mjs`.
Interface: `Solver(space,mode,{strategy,seed,...limits})` exposes `nextGuess()` and
`observe(guess,observation)`; trial runner is the sole engine/solver coordinator.
- [x] Test no secret/engine dependency, reproducibility and bounded sampling.
- [x] Implement random, elimination, expected-residual and information policies.
- [x] Test noiseless entropy and noisy mutual information against enumerated cases.
- [x] Implement CLI with explicit seeds, sample/work/time/memory budgets and output.

## Task 4: Experiments, report and delivery

Files: `analysis/results/`, `docs/BALANCE_REPORT.md`, README, CI workflow.
- [x] Run a pilot, choose and record fixed compute limits, then all nine modes.
- [x] Save per-game evidence and summaries; report uncertainty and failure traces.
- [x] Independently review mathematical claims, code and data preservation.
- Run syntax, old tests, the full suite and evidence replay before committing and pushing the branch.
- Create PR, verify CI on its head, reconcile Trello and leave merge to the user.

The last two items are delivery gates executed after this planning snapshot;
the pull request and its checks are the authoritative record of remote delivery.
