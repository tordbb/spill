# Quality board generation for the 6×6 animal Sudoku / Queens game

## Purpose

This file records the board-generation method developed and tested for the 6×6 animal puzzle in **Lekeverkstedet**.

The game is structurally a one-star **Queens / Star Battle** puzzle rather than a number Sudoku:

- the board is 6×6;
- exactly one animal is placed in every row;
- exactly one animal is placed in every column;
- exactly one animal is placed in every coloured region;
- animals may not touch, including diagonally.

The important conclusion from the earlier research was that a board is not “good” merely because it has one mathematical solution. A quality board should also have a human-readable logical path to that solution, without guessing.

The recommended pipeline is therefore:

1. generate a complete valid animal placement first;
2. grow six connected regions around those six solution cells;
3. require exactly one global solution using an independent exact solver;
4. require a human-style logical solver to finish the board without guessing;
5. grade/select boards by the strongest deduction technique actually required.

This is the method that produced the improved eight-board set.

---

## 1. Generate the solution before the regions

Represent a complete solution as an array

```text
solution[row] = column
```

For a 6×6 board, generate permutations of columns `0..5` such that:

- every column occurs once; and
- animals in consecutive rows are not vertically or diagonally adjacent:

```text
abs(solution[r] - solution[r - 1]) > 1
```

Because there is exactly one animal per row and column, checking adjacent rows is enough to enforce the “animals do not touch” rule.

For `N = 6`, there are **90** such complete placements. Randomly selecting among them provides plenty of different solution skeletons.

Do not create a whole level set merely by rotating/reflection-transforming one base board. Transformations are useful for testing, but a quality level set should contain genuinely different region structures and logical paths.

---

## 2. Grow six connected regions from the six solution cells

Create six region labels, conventionally `A` through `F`.

Use the six solution cells as seeds, one seed for each region. Grow the regions until all 36 cells are assigned.

The generation algorithm may use randomized frontier/flood-fill growth; the implementation detail is flexible, but the following invariants are not:

- every cell belongs to exactly one region;
- there are exactly six regions;
- every region is orthogonally connected;
- each region contains exactly one cell from the generated solution;
- the resulting shapes should be visually distinguishable and not all trivial stripes/rectangles.

Growing regions from solution seeds ensures that the intended solution automatically has one animal in every region, but **does not** prove uniqueness. Uniqueness must be checked separately.

---

## 3. Prove uniqueness with an exact solver

After region generation, count solutions independently of the stored/generated solution.

A simple row-by-row backtracker is enough for 6×6.

Track:

- used columns;
- used regions;
- the column chosen in the previous row.

For each row, try every column that:

- is not already used;
- belongs to a region not already used;
- does not touch the previous row's animal (`abs(c - prevC) > 1`).

Stop counting once two solutions are found. A board is acceptable only when:

```text
solution_count == 1
```

Pseudocode:

```text
count = 0

search(row, previousColumn):
    if count >= 2:
        return

    if row == 6:
        count += 1
        return

    for column in 0..5:
        region = regionAt(row, column)

        if column is already used:
            continue
        if region is already used:
            continue
        if row > 0 and abs(column - previousColumn) <= 1:
            continue

        mark column and region used
        search(row + 1, column)
        unmark column and region
```

Do not trust the generated solution itself as the uniqueness proof. The exact checker must be independent.

---

## 4. Reject boards that require guessing

Uniqueness alone is insufficient. A player can face a uniquely solvable board that gives no reasonable next move.

Each candidate board should therefore also be passed through a deterministic, human-style logical solver. If that solver becomes stuck before finding all six animals, reject the board.

The solver should model the deductions a child can reasonably make with animal placements and X marks.

### Candidate state

A found animal logically eliminates:

- every other cell in its row;
- every other cell in its column;
- every other cell in its region;
- every touching neighbour, including diagonals.

These logical eliminations do not need to be automatically drawn as X marks in the UI. They are solver state.

For every unfinished row, column and region, keep the remaining candidate cells.

If an unfinished required unit has zero candidates, the state is contradictory.

---

## 5. Human deduction rules

The solver used in the successful generation work applied the following rules, in roughly this order.

### A. Forced single

If an unfinished region, row or column has exactly one remaining candidate, that cell must contain the animal.

Region singles are especially useful to check first because they are visually intuitive on a coloured board.

This is the easiest deduction level.

### B. Crowding / common-neighbour elimination

Suppose an unfinished row, column or region has several possible animal cells.

If some outside candidate cell touches **every** remaining possible location of that required animal, the outside cell cannot itself contain an animal.

Example idea:

- a coloured region has only two places left for its animal;
- a nearby square touches both of them;
- whichever of those two cells eventually contains the region's animal would touch the nearby square;
- therefore the nearby square is safely X.

This produces useful eliminations that are more human than arbitrary search.

### C. Line lock / one-unit lock

General principle:

If all candidates for one unfinished source unit lie inside exactly one target unit, that target unit is reserved for the source unit's animal. Other source units cannot use candidate cells in that same target unit.

Useful source/target combinations include:

- region → row;
- region → column;
- row → region;
- column → region;
- row → column;
- column → row.

This is the `k = 1` case of the more general Hall-style lock below.

### D. Pair lock

For two unfinished source units:

If the union of their candidate cells lies in exactly two target units, those two target units are reserved by those two source units.

Therefore candidate cells in those target units that belong to other source units can be marked X.

Examples:

- two regions are confined to the same two rows;
- two rows are confined to the same two regions.

This is the `k = 2` Hall-style lock.

### E. Triple lock

The same logic can be generalized to three source units confined to exactly three target units.

The engine developed during the earlier work supported this (`k = 3`), but the accepted eight-board set did not require triple locks. It is useful as an extension for harder future levels.

---

## 6. General Hall-style lock formulation

For source dimension `src` and target dimension `tgt`:

1. choose `k` unfinished source units;
2. collect all remaining candidate cells in those source units;
3. find the set of target units containing those candidates;
4. if the candidates occupy exactly `k` target units, those target units are reserved;
5. eliminate candidates in those target units that belong to source units outside the selected set.

Test `k = 1..3`.

The earlier solver checked these dimension pairs:

```text
region -> row
region -> column
row    -> region
column -> region
row    -> column
column -> row
```

This compactly covers line locks, pair locks and triple locks.

---

## 7. Difficulty grading

Grade a board according to the strongest logical technique required by the human-style solver.

Recommended scale used in the improved board set:

- **grade 0** — forced singles are enough;
- **grade 1** — requires crowding and/or a line lock;
- **grade 2** — requires a pair lock;
- **grade 3** — requires a triple lock.

The current approved progression used:

- 2 boards at grade 0;
- 3 boards at grade 1;
- 3 boards at grade 2.

A generator can create many valid candidates and then select boards to produce a smooth progression instead of merely accepting the first eight unique boards.

When validating a stored board, verify that the solver's measured maximum grade does not exceed the board's declared grade.

---

## 8. Acceptance checklist for a generated board

A candidate should be accepted only if all of the following are true:

- [ ] 6×6 grid.
- [ ] Six regions, each orthogonally connected.
- [ ] The generated solution has one animal per row.
- [ ] The generated solution has one animal per column.
- [ ] The generated solution has one animal per region.
- [ ] No two solution animals touch, including diagonally.
- [ ] Independent exact solution count is exactly 1.
- [ ] Human-style solver reaches all six animals without guessing.
- [ ] Human solver's result matches the exact/generated solution.
- [ ] Measured difficulty fits the intended grade.
- [ ] Region shapes are visually readable and sufficiently varied from the other levels.
- [ ] The level is not merely a rotated/reflected clone of another level in the set.

This two-solver approach is important:

- the **exact solver** proves uniqueness;
- the **human solver** proves playability.

A board must pass both.

---

## 9. Relationship to the hint system

The same human-style solver is useful for hints because it can identify a logically justified next move.

However, board-generation logic and hint UI should remain separate.

In particular, current gameplay requirements may allow players to place incorrect manual X marks. The hint solver therefore should not blindly treat every player's X as a proven fact. It can replay deductions from confirmed animal placements and find the first sound move the player has not made.

The timing and presentation of hints are product/UI decisions and should not be baked into the board-generation algorithm.

---

## 10. Reference: eight boards selected by this method

Region maps use letters `A..F`. `solution` gives the animal column for rows `0..5`.

### Level 1 — grade 0

```text
ACCBBB
CCCBBB
CCCCBD
EECDDD
FEEEDD
FFEEED
```

```text
solution = [0, 4, 2, 5, 3, 1]
```

### Level 2 — grade 0

```text
CCAAAA
CCABBB
CCCBBB
ECCDDD
EECEDD
FEEEED
```

```text
solution = [2, 4, 1, 5, 3, 0]
```

### Level 3 — grade 1

```text
AAAACC
AABACC
DDFFCC
DDFCCE
DDFCCE
DDFFEE
```

```text
solution = [0, 2, 4, 1, 5, 3]
```

### Level 4 — grade 1

```text
AAABBB
FACCBB
FACCEE
FDCCEE
FFCCEE
FFCCCE
```

```text
solution = [2, 5, 3, 1, 4, 0]
```

### Level 5 — grade 1

```text
BBBAAA
BBBAAC
BBBAAC
EEEDCC
EEEFFC
EEFFFF
```

```text
solution = [4, 1, 5, 3, 0, 2]
```

### Level 6 — grade 2

```text
BBAADD
BBBADD
BAAADC
EEEDDD
EEEEFF
EFFFFF
```

```text
solution = [2, 0, 5, 3, 1, 4]
```

### Level 7 — grade 2

```text
AAABBD
AAABBD
CBBBDD
EEEEDF
EEEEFF
EEFFFF
```

```text
solution = [1, 3, 0, 4, 2, 5]
```

### Level 8 — grade 2

```text
BBBCAC
BBBCCC
BDDCCC
BDDEEE
FDFFEE
FFFFEE
```

```text
solution = [4, 0, 3, 1, 5, 2]
```

---

## 11. Recommended workflow for creating more levels

For future level generation:

```text
repeat until enough good boards have been collected:
    choose a valid non-touching 6-animal solution
    grow six connected regions from its six animal cells

    if structural region checks fail:
        reject

    if exact_solution_count(board) != 1:
        reject

    result = human_logic_solve(board)
    if result is stuck or contradictory:
        reject

    if result.solution != generated_solution:
        reject

    measure difficulty from strongest deduction used
    score visual variety / similarity to existing levels
    keep the strongest candidates for the desired difficulty bucket
```

Generate far more candidates than are required and curate the final set. The quality came from **filtering**, not from assuming that region growth itself produces a good puzzle.

---

## Core conclusion

The reliable recipe is:

> **solution first → connected regions → exact uniqueness proof → human-logic proof → difficulty/variety curation**

That combination avoids both major failure modes:

1. ambiguous boards with multiple valid animal placements; and
2. technically unique boards that feel arbitrary because the player must guess.
