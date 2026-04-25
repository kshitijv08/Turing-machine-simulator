#include <stdio.h>
#include <string.h>

#define MAX_TRANS  100
#define TAPE_SIZE  200
#define STEP_LIMIT 1000

typedef struct {
    int  cs;
    char read;
    int  ns;
    char write;
    char move;
} Transition;

Transition trans[MAX_TRANS];
char tape[TAPE_SIZE];

/* ── tape helpers ─────────────────────────────────────────────────── */

void initTape(const char *input, char blank)
{
    for (int i = 0; i < TAPE_SIZE; i++) tape[i] = blank;
    int start = TAPE_SIZE / 2;
    for (int i = 0; input[i]; i++) tape[start + i] = input[i];
}

void printTape(int head, char blank)
{
    int from = head - 10, to = head + 10;
    if (from < 0) from = 0;
    if (to >= TAPE_SIZE) to = TAPE_SIZE - 1;

    while (tape[from] == blank && from < head) from++;

    for (int i = from; i <= to; i++) printf("%c", tape[i]);
    printf("\n");
    for (int i = from; i <= to; i++) printf("%c", i == head ? '^' : ' ');
    printf("\n");
}

/* ── machine runner ───────────────────────────────────────────────── */

void runMachine(int start, int accept, int reject,
                int numTrans, char blank, const char *input)
{
    initTape(input, blank);
    int head  = TAPE_SIZE / 2;
    int state = start;
    int step  = 0;

    while (step < STEP_LIMIT) {
        printf("\nStep %d | State q%d\n", step, state);
        printTape(head, blank);

        if (state == accept) { printf(">> ACCEPTED\n"); return; }
        if (state == reject) { printf(">> REJECTED\n"); return; }

        char sym  = tape[head];
        int found = 0;

        for (int i = 0; i < numTrans; i++) {
            if (trans[i].cs == state && trans[i].read == sym) {
                printf("   Firing: (q%d,'%c') -> write '%c', move %c, -> q%d\n",
                       state, sym, trans[i].write, trans[i].move, trans[i].ns);
                tape[head] = trans[i].write;
                state      = trans[i].ns;
                head      += (trans[i].move == 'R') ? 1 : -1;
                found      = 1;
                break;
            }
        }

        if (!found) { printf(">> No transition. REJECTED\n"); return; }
        step++;
    }
    printf(">> Step limit reached (infinite loop?)\n");
}

/* ── preset loader ────────────────────────────────────────────────── */

void loadPreset(int choice)
{
    int  n = 0;
    char input[100];

    switch (choice) {

    /* ── 1. aⁿbⁿcⁿ ─────────────────────────────────────────── */
    case 1:
        printf("\n=== Preset 1: a^n b^n c^n Acceptor ===\n");
        printf("Accepts strings of the form a^n b^n c^n (e.g. aabbcc)\n");

        trans[n++] = (Transition){0,'a',1,'X','R'};
        trans[n++] = (Transition){1,'a',1,'a','R'};
        trans[n++] = (Transition){1,'Y',1,'Y','R'};
        trans[n++] = (Transition){1,'b',2,'Y','R'};
        trans[n++] = (Transition){2,'b',2,'b','R'};
        trans[n++] = (Transition){2,'Z',2,'Z','R'};
        trans[n++] = (Transition){2,'c',3,'Z','L'};
        trans[n++] = (Transition){3,'b',3,'b','L'};
        trans[n++] = (Transition){3,'Z',3,'Z','L'};
        trans[n++] = (Transition){3,'Y',3,'Y','L'};
        trans[n++] = (Transition){3,'a',3,'a','L'};
        trans[n++] = (Transition){3,'X',0,'X','R'};
        trans[n++] = (Transition){0,'Y',4,'Y','R'};
        trans[n++] = (Transition){4,'Y',4,'Y','R'};
        trans[n++] = (Transition){4,'Z',4,'Z','R'};
        trans[n++] = (Transition){4,'_',5,'_','R'};

        printf("Enter input string (default: aabbcc): ");
        scanf("%s", input);
        runMachine(0, 5, 6, n, '_', input);
        break;

    /* ── 2. Palindrome over {a,b} ───────────────────────────── */
    case 2:
        printf("\n=== Preset 2: Palindrome Checker over {a,b} ===\n");
        printf("Accepts palindromes like 'abba', 'aba', 'a'\n");

        trans[n++] = (Transition){0,'a',1,'_','R'};
        trans[n++] = (Transition){0,'b',2,'_','R'};
        trans[n++] = (Transition){0,'_',6,'_','R'};
        trans[n++] = (Transition){1,'a',1,'a','R'};
        trans[n++] = (Transition){1,'b',1,'b','R'};
        trans[n++] = (Transition){1,'_',3,'_','L'};
        trans[n++] = (Transition){2,'a',2,'a','R'};
        trans[n++] = (Transition){2,'b',2,'b','R'};
        trans[n++] = (Transition){2,'_',4,'_','L'};
        trans[n++] = (Transition){3,'a',5,'_','L'};
        trans[n++] = (Transition){3,'_',6,'_','R'};
        trans[n++] = (Transition){4,'b',5,'_','L'};
        trans[n++] = (Transition){4,'_',6,'_','R'};
        trans[n++] = (Transition){5,'a',5,'a','L'};
        trans[n++] = (Transition){5,'b',5,'b','L'};
        trans[n++] = (Transition){5,'_',0,'_','R'};

        printf("Enter input string (default: abba): ");
        scanf("%s", input);
        runMachine(0, 6, 7, n, '_', input);
        break;

    /* ── 3. Unary Adder ─────────────────────────────────────── */
    case 3:
        printf("\n=== Preset 3: Unary Adder ===\n");
        printf("Input format: 1s + 1s separated by '+' (e.g. 111+11 = 11111)\n");
        printf("Replaces '+' with 1, blanks last 1\n");

        trans[n++] = (Transition){0,'1',0,'1','R'};
        trans[n++] = (Transition){0,'+',0,'1','R'};
        trans[n++] = (Transition){0,'_',1,'_','L'};
        trans[n++] = (Transition){1,'1',2,'_','L'};

        printf("Enter input string (default: 111+11): ");
        scanf("%s", input);
        runMachine(0, 2, 3, n, '_', input);
        break;

    /* ── 4. Binary Flip ─────────────────────────────────────── */
    case 4:
        printf("\n=== Preset 4: Binary Flip (0 <-> 1) ===\n");
        printf("Flips every bit in the input (e.g. 1010 -> 0101)\n");

        trans[n++] = (Transition){0,'0',0,'1','R'};
        trans[n++] = (Transition){0,'1',0,'0','R'};
        trans[n++] = (Transition){0,'_',1,'_','R'};

        printf("Enter input string (default: 101010): ");
        scanf("%s", input);
        runMachine(0, 1, 2, n, '_', input);
        break;

    /* ── 5. ww Acceptor ─────────────────────────────────────── */
    case 5:
        printf("\n=== Preset 5: ww Acceptor ===\n");
        printf("Accepts strings of the form ww over {a,b} (e.g. abab, aabb is NOT ww)\n");

        trans[n++] = (Transition){0,'a',1,'A','R'};
        trans[n++] = (Transition){0,'b',2,'B','R'};
        trans[n++] = (Transition){0,'_',8,'_','R'};
        trans[n++] = (Transition){1,'a',1,'a','R'};
        trans[n++] = (Transition){1,'b',1,'b','R'};
        trans[n++] = (Transition){1,'_',3,'_','L'};
        trans[n++] = (Transition){2,'a',2,'a','R'};
        trans[n++] = (Transition){2,'b',2,'b','R'};
        trans[n++] = (Transition){2,'_',4,'_','L'};
        trans[n++] = (Transition){3,'a',5,'_','L'};
        trans[n++] = (Transition){4,'b',5,'_','L'};
        trans[n++] = (Transition){5,'a',5,'a','L'};
        trans[n++] = (Transition){5,'b',5,'b','L'};
        trans[n++] = (Transition){5,'A',0,'A','R'};
        trans[n++] = (Transition){5,'B',0,'B','R'};
        trans[n++] = (Transition){0,'A',6,'A','R'};
        trans[n++] = (Transition){0,'B',7,'B','R'};
        trans[n++] = (Transition){6,'A',6,'A','R'};
        trans[n++] = (Transition){6,'B',6,'B','R'};
        trans[n++] = (Transition){6,'_',8,'_','R'};
        trans[n++] = (Transition){7,'A',7,'A','R'};
        trans[n++] = (Transition){7,'_',8,'_','R'};

        printf("Enter input string (default: abab): ");
        scanf("%s", input);
        runMachine(0, 8, 9, n, '_', input);
        break;

    default:
        printf("Invalid choice.\n");
    }
}

/* ── manual input mode ────────────────────────────────────────────── */

void manualMode()
{
    int states, numTrans, start, accept, reject;
    char blank, input[100];

    printf("\n=== Manual TM Entry ===\n");
    printf("Number of states: ");      scanf("%d",  &states);
    printf("Blank symbol: ");          scanf(" %c", &blank);
    printf("Start state: ");           scanf("%d",  &start);
    printf("Accept state: ");          scanf("%d",  &accept);
    printf("Reject state: ");          scanf("%d",  &reject);
    printf("Number of transitions: "); scanf("%d",  &numTrans);

    for (int i = 0; i < numTrans; i++) {
        printf("  Transition %d (cs read ns write move): ", i + 1);
        scanf("%d %c %d %c %c",
              &trans[i].cs, &trans[i].read,
              &trans[i].ns, &trans[i].write, &trans[i].move);
    }

    printf("Input string: ");
    scanf("%s", input);
    runMachine(start, accept, reject, numTrans, blank, input);
}

/* ── main ─────────────────────────────────────────────────────────── */

int main()
{
    int choice;

    printf("========================================\n");
    printf("       TURING MACHINE SIMULATOR         \n");
    printf("========================================\n");
    printf(" 1. a^n b^n c^n Acceptor\n");
    printf(" 2. Palindrome Checker {a,b}\n");
    printf(" 3. Unary Adder\n");
    printf(" 4. Binary Flip\n");
    printf(" 5. ww Acceptor\n");
    printf(" 6. Manual Entry\n");
    printf("========================================\n");
    printf("Choose option: ");
    scanf("%d", &choice);

    if (choice == 6)
        manualMode();
    else
        loadPreset(choice);

    return 0;
}
