# Turing Machine Simulator


## Files

| File              | Role                                      | Who explains        |
|-------------------|-------------------------------------------|---------------------|
| `index.html`      | Page structure — panels, tape, buttons    | Person 1            |
| `style.css`       | All styling and animations                | Person 2            |
| `tm.js`           | Full simulation logic (mirrors C code)    | Person 3 + 4        |
| `tm_simulator.c`  | C terminal version — menu + switch-case   | Person 5            |

---

## How to Run

### Browser (Visual Simulator)
1. Keep all 3 files (`index.html`, `style.css`, `tm.js`) in the **same folder**
2. Double-click `index.html` — opens in any browser, no server needed

### Terminal (C version)
```bash
# Compile
gcc -o tm_simulator tm_simulator.c

# Run — shows menu
./tm_simulator
```

---

## Presets (both versions have the same 5)

| # | Name               | Language                        | Example input |
|---|--------------------|---------------------------------|---------------|
| 1 | aⁿbⁿcⁿ Acceptor   | { aⁿbⁿcⁿ \| n ≥ 1 } — CSL      | `aabbcc`      |
| 2 | Palindrome {a,b}   | Palindromes over {a,b}          | `abba`        |
| 3 | Unary Adder        | Adds two unary numbers          | `111+11`      |
| 4 | Binary Flip        | Flips every bit (0↔1)           | `101010`      |
| 5 | ww Acceptor        | { ww \| w ∈ {a,b}* }            | `abab`        |

---

## Transition Tables

### 1. aⁿbⁿcⁿ Acceptor
Accept = q5, Reject = q6, Blank = `_`

| # | CS  | Read | NS  | Write | Move |
|---|-----|------|-----|-------|------|
| 1 | q0  | a    | q1  | X     | R    |
| 2 | q1  | a    | q1  | a     | R    |
| 3 | q1  | Y    | q1  | Y     | R    |
| 4 | q1  | b    | q2  | Y     | R    |
| 5 | q2  | b    | q2  | b     | R    |
| 6 | q2  | Z    | q2  | Z     | R    |
| 7 | q2  | c    | q3  | Z     | L    |
| 8 | q3  | b    | q3  | b     | L    |
| 9 | q3  | Z    | q3  | Z     | L    |
|10 | q3  | Y    | q3  | Y     | L    |
|11 | q3  | a    | q3  | a     | L    |
|12 | q3  | X    | q0  | X     | R    |
|13 | q0  | Y    | q4  | Y     | R    |
|14 | q4  | Y    | q4  | Y     | R    |
|15 | q4  | Z    | q4  | Z     | R    |
|16 | q4  | _    | q5  | _     | R    |

**How it works:** Repeatedly marks one `a` as X, one `b` as Y, one `c` as Z, sweeps back, repeats. Accepts when all symbols are marked.

---

### 2. Palindrome Checker {a,b}
Accept = q6, Reject = q7, Blank = `_`

| # | CS  | Read | NS  | Write | Move |
|---|-----|------|-----|-------|------|
| 1 | q0  | a    | q1  | _     | R    |
| 2 | q0  | b    | q2  | _     | R    |
| 3 | q0  | _    | q6  | _     | R    |
| 4 | q1  | a    | q1  | a     | R    |
| 5 | q1  | b    | q1  | b     | R    |
| 6 | q1  | _    | q3  | _     | L    |
| 7 | q2  | a    | q2  | a     | R    |
| 8 | q2  | b    | q2  | b     | R    |
| 9 | q2  | _    | q4  | _     | L    |
|10 | q3  | a    | q5  | _     | L    |
|11 | q3  | _    | q6  | _     | R    |
|12 | q4  | b    | q5  | _     | L    |
|13 | q4  | _    | q6  | _     | R    |
|14 | q5  | a    | q5  | a     | L    |
|15 | q5  | b    | q5  | b     | L    |
|16 | q5  | _    | q0  | _     | R    |

**How it works:** Reads first character, blanks it, goes to end, checks last character matches, blanks it, repeats inward.

---

### 3. Unary Adder
Accept = q2, Reject = q3, Blank = `_`

Input format: `111+11` (unary m + unary n → unary m+n)

| # | CS  | Read | NS  | Write | Move |
|---|-----|------|-----|-------|------|
| 1 | q0  | 1    | q0  | 1     | R    |
| 2 | q0  | +    | q0  | 1     | R    |
| 3 | q0  | _    | q1  | _     | L    |
| 4 | q1  | 1    | q2  | _     | L    |

**How it works:** Replaces `+` with `1` (so m+n ones exist), then blanks the last `1` (since `+` became a `1`, we have one extra). Result is m+n ones.

---

### 4. Binary Flip
Accept = q1, Reject = q2, Blank = `_`

| # | CS  | Read | NS  | Write | Move |
|---|-----|------|-----|-------|------|
| 1 | q0  | 0    | q0  | 1     | R    |
| 2 | q0  | 1    | q0  | 0     | R    |
| 3 | q0  | _    | q1  | _     | R    |

**How it works:** Scans right, flips each bit, halts at blank.

---

### 5. ww Acceptor
Accept = q8, Reject = q9, Blank = `_`

| # | CS  | Read | NS  | Write | Move |
|---|-----|------|-----|-------|------|
| 1 | q0  | a    | q1  | A     | R    |
| 2 | q0  | b    | q2  | B     | R    |
| 3 | q0  | _    | q8  | _     | R    |
| 4 | q1  | a    | q1  | a     | R    |
| 5 | q1  | b    | q1  | b     | R    |
| 6 | q1  | _    | q3  | _     | L    |
| 7 | q2  | a    | q2  | a     | R    |
| 8 | q2  | b    | q2  | b     | R    |
| 9 | q2  | _    | q4  | _     | L    |
|10 | q3  | a    | q5  | _     | L    |
|11 | q4  | b    | q5  | _     | L    |
|12 | q5  | a    | q5  | a     | L    |
|13 | q5  | b    | q5  | b     | L    |
|14 | q5  | A    | q0  | A     | R    |
|15 | q5  | B    | q0  | B     | R    |
|16 | q0  | A    | q6  | A     | R    |
|17 | q0  | B    | q7  | B     | R    |
|18 | q6  | A    | q6  | A     | R    |
|19 | q6  | B    | q6  | B     | R    |
|20 | q6  | _    | q8  | _     | R    |
|21 | q7  | A    | q7  | A     | R    |
|22 | q7  | _    | q8  | _     | R    |

**How it works:** Marks first symbol of first half, finds matching symbol at midpoint of string, repeats. Accepts only if both halves are identical.

---

## UI Features (index.html + tm.js)

- **Tape animation** — slides left/right as head moves, active cell highlighted
- **Transition table** — firing row highlights in real time
- **Step log** — every transition fired is logged with full detail
- **Manual TM** — expand the panel, add transition rows one by one, set start/accept/reject states, hit Apply & Load
- **Speed control** — slider from crawl to max
- **Run / Step / Pause / Reset** controls

## C Terminal Features (tm_simulator.c)

- Menu with `switch-case` for all 5 presets
- Each preset prompts for custom input (or use default)
- Option 6 for full manual entry
- Prints tape + head position at every step
- Shows which transition fired each step

---

## Compile & Run Reference

```bash
gcc -o tm_simulator tm_simulator.c

./tm_simulator
# then choose 1-5 for presets, 6 for manual

# Sample: preset 1 with aabbcc
# Choose: 1
# Input:  aabbcc  (or just press enter for default)
```

---

