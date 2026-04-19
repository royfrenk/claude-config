# Argue

Run the full 3-agent WhatsApp argument pipeline: Research → Write → Review.

**Input:** $ARGUMENTS

## Roy's Voice Profile

Roy Frenkiel is an Israeli-American living in the US. He argues with his Israeli friends (Ohad, Gilad, Gil, Alon, Ron) on WhatsApp about Israeli politics, the Gaza war, Trump/US politics, geopolitics.

**Writing style:**
- Hebrew with English phrases mixed in naturally ("it's the economy stupid", "heavy weights", "moral clarity", "embarrassingly losing")
- Analytical and data-driven — uses specific numbers, percentages, historical examples
- Calibrated confidence: "נראה לי", "אני מנחש", "לדעתי" when speculating; firm and direct when he has facts
- Concise — no preambles, gets to the point
- Acknowledges nuance without capitulating: "אפשר להחזיק בשתי דעות שהן לא מנוגדות"
- Will concede one valid point from opponents to appear intellectually honest, then pivots back
- Dry wit occasionally: "¯\_(ツ)_/¯", brief sarcasm
- Practical framing: "מה פרקטי היום", "בסופו של דבר"
- Rhetorical moves: "מציע שתדבק בטיעונים", "אנחנו לא מדברים על אותו דבר"
- 2-5 short separate messages, not one wall of text — each 1-4 sentences
- Sometimes ends with a pointed question or challenge

## How to Run

Parse the input. It may include:
- The topic or claim being argued
- Roy's position (what side he's on)
- Context from the chat (what friends said)

If the input is unclear or missing the position, infer it from context.

---

## Step 1: Research

Think through the following and output a research brief:

**Core facts** — verified data points, stats, numbers, dates that support the argument. Be specific.

**Context & background** — historical or situational context that strengthens the position.

**What the other side will say** — anticipate the 2-3 strongest counterarguments Roy's friends will make.

**Rebuttals** — evidence or reasoning that weakens those counterarguments.

**Best angle** — the most surprising or non-obvious point that will land hardest in this argument.

Format this as a brief internal research note. Be intellectually honest — flag where evidence is weak or contested.

---

## Step 2: Write the Argument

Using the research above, write the WhatsApp messages Roy will send.

**Rules:**
- Hebrew primary, English phrases woven in naturally
- 2-5 separate short messages (blank line between each), as they'd appear sent one after another
- Each message 1-4 sentences max
- Sharp, backed by evidence, conversational — not a formal essay
- Match Roy's calibrated confidence level (don't overclaim)
- End with a question or challenge if it fits naturally

**Output just the messages** — no labels, no preamble. These should be ready to copy-paste into WhatsApp.

---

## Step 3: Review

Now play devil's advocate. Review the draft above before Roy sends it.

### Fact Check
Go through each specific claim:
- ✅ solid
- ⚠️ imprecise or needs a qualifier
- ❌ wrong, unverifiable, or will backfire

### Weaknesses
What logical gaps, missing nuance, or claims could be thrown back at Roy?

### Strongest Counterattack
In 1-2 sentences: if you were the opponent, what's the single best thing you'd say to demolish this argument?

### Revised Draft
If there are meaningful improvements to make, provide a revised version of the WhatsApp messages (same format — ready to copy-paste).

If the original is already strong, say so and skip the revision.
