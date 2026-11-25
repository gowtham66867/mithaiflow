Build **MithaiFlow**, a working entry for Festive Hacks (Bengaluru, 25 Nov 2026) for a neighbourhood sweet shop taking festive preorders.

**Promise:** "Take festive orders in your customer's language, and only promise what your shop can fulfil."

## 0. The clock decides everything

Submissions close at **5:00 PM IST today** and nothing is accepted after. Check the current time before you start and after every milestone.

- **4:00 PM: stop adding features.** Only fixes after this.
- **4:00 to 4:30: README, clean-clone check, push to a public repo.**
- **4:30 to 4:50: I record the demo video and submit.** Have the app running and seeded for me.

Judges score three things: the problem, whether the main flow runs, and how well each sponsor tool is used. All three sponsor tools (Sarvam AI, Flagsmith, NudgeBee) are mandatory. A main flow that runs beats a larger product that half-runs. If a milestone is running more than 15 minutes late, cut from the bottom of the cut list in section 6 and tell me in one line.

Work autonomously. Ask me only for credentials or a decision that truly blocks you. Commit after every working milestone. Never commit secrets: the repo is public.

## 1. First 25 minutes: prove sponsor access

Before any product code, make the smallest real call to each sponsor and report pass/fail. Ask me for all keys in a single message.

- **Sarvam** (https://docs.sarvam.ai/): one speech-to-text call, one chat call, one text-to-speech call. Read the organisers' reference repo first, https://github.com/aayush-wemakedevs/shikayat-desk, and copy its working patterns. Known constraints from it: the synchronous STT endpoint rejects audio over 30 seconds, so stop recording at 25; TTS speakers are model-specific and a mismatch returns 400. Confirm model names and language codes against the docs; do not guess.
- **Flagsmith** (https://docs.flagsmith.com/): read one flag and one remote-config value with the server-side SDK, using a server-side environment key.
- **NudgeBee** (https://docs.nudgebee.com/): this is the highest-risk integration. In 15 minutes, find the fastest genuine way to have NudgeBee receive an event from our app and drive an approval-gated action back to it. Tell me exactly what account, install or key you need. If that path is not possible in the time, say so immediately and propose the smallest real alternative the docs support. Do not fake it.

## 2. Stack

- Next.js (App Router) + TypeScript + Tailwind, one repo, runs with `npm install && npm run dev`.
- Prisma. Use PostgreSQL only if it is already running on this machine; otherwise SQLite, so a judge can clone and run with no database setup.
- Zod on every request body and on model output.
- Integer grams and integer paise in storage; show kg and rupees.
- Seed: one shop, three products (kaju katli, motichoor laddu, mysore pak), prices, stock, tomorrow's pickup slots. Label it "sample data" in the UI. Seed one product with exactly 1 kg left for the oversell demo.
- All sponsor keys server-side only.

## 3. The main flow (build this completely first)

1. Customer taps the mic (explicit start/stop, 25-second cap) or types. A "try a sample" chip fills in "कल शाम छह बजे दो किलो काजू कतली चाहिए" so the demo never depends on the room's noise.
2. Sarvam STT returns the transcript; it is editable.
3. Sarvam chat model returns JSON: product, quantity in grams, pickup date, slot, language, open questions. Validate with Zod. The model only interprets language. Code decides price, stock, slot and acceptance.
4. Review card: editable, shows the absolute date resolved in Asia/Kolkata, and asks rather than guesses when quantity, unit, product or time is missing. Never silently substitute.
5. Confirm: one transaction that checks controls, recomputes the total from catalogue prices, and reserves stock and slot with conditional updates (`UPDATE ... WHERE remaining >= qty`), so the last kilo cannot be sold twice. An idempotency key makes a double-click return the same order.
6. Receipt with an unguessable order reference, items, pickup time, total, and a Sarvam TTS readback in the customer's language.
7. On a stock or slot conflict, explain it plainly and offer what is available.

## 4. Sponsor work a judge can see

**Flagsmith (there is a separate ₹1,00,000 prize for best use, so it must do real work):**
- `accepting_orders` (flag): enforced in the confirm transaction on the server. Off means new orders are refused with a clear message while receipts still load.
- `pickup_slot_order_limit` (remote config value): the server reads it at confirm time. Lowering it keeps existing orders and refuses new ones for that slot.
- `voice_ordering_enabled` (flag evaluated per identity, with a segment override): voice is on for a "regular customers" segment and off for others, showing identities and segments, not just a global toggle.
- Short cache (about 10 seconds) so a change in the Flagsmith dashboard shows on screen during the demo. If Flagsmith is unreachable, voice falls back to text and new confirmations are refused. State both in the README.
- Stretch, only if everything else is done by 3:30: a multivariate flag on the confirm button wording with a tracked conversion event. Report it as "experiment wired up", never as a result.

**NudgeBee:** a labelled, application-level "checkout failure" switch. Triggering it makes `/api/health` report degraded and notifies NudgeBee; NudgeBee asks a human to approve; on approval it calls our authenticated recovery endpoint; health returns to OK and the incident is recorded with its duration. Recovery is idempotent. Describe this as a controlled failure exercise. Do not claim Kubernetes remediation or root-cause analysis.

**Sarvam:** STT, chat-based order parsing and TTS readback as above, Hindi and English.

## 5. Screens

- **Customer** (`/`): festive header, three product cards with price and live stock, language toggle, mic and text, review card, receipt. Mobile first; the video will likely be shot at phone width.
- **Shop** (`/shop`, behind one env-configured password): orders by slot, stock remaining, slot use, live Flagsmith values, health status, incident history, the labelled failure switch, and an **"Oversell test"** button that fires two simultaneous confirmations for the last kilo and shows one accepted, one refused, side by side.

Warm cream, saffron and pistachio; large readable type; strong contrast. Loading, error and paused states on the customer screen. No stack traces or keys in the UI.

## 6. Cut list (drop from the bottom up when late)

Keep these unless I say otherwise: the main flow, the three Flagsmith controls, the NudgeBee loop, the oversell button.

Already out of scope: payments, delivery, WhatsApp, multiple shops, forecasting, a separate operations page, a separate demo-guide page.

Cut in this order if needed:
1. Multivariate experiment.
2. Order status changes (ready/collected) and cancellation.
3. Metrics beyond a simple count of confirmed, refused-for-stock and refused-for-slot.
4. Language toggle polish, animations.
5. Flagsmith segment override (fall back to a plain flag).

## 7. Tests (four, no more)

1. Two concurrent confirmations for the last stock: exactly one succeeds.
2. Same idempotency key twice: one order.
3. Total is computed from server prices, ignoring any client-sent price.
4. `accepting_orders` off: confirm is refused, receipt lookup still works.

Run type check and these tests before the final push. Open the customer screen at phone and desktop widths and fix anything broken.

## 8. Submission pack (by 4:30)

- **README** a stranger can set up from: one-paragraph problem, a screenshot, setup in five commands or fewer, `.env.example` with every variable, a "Where each sponsor tool is used" table with file paths, how to reproduce the Flagsmith and NudgeBee demos, known limitations, and a line disclosing AI coding assistance.
- **Clean-clone check:** clone into a temp folder, follow the README exactly, confirm it runs.
- **`DEMO.md`, a two-minute video script** in this order:
  1. 0:00 to 0:15, the problem: a Diwali rush, a phone order scribbled on paper, the last kilo promised twice.
  2. 0:15 to 0:50, Hindi voice order, review, confirm, spoken receipt (Sarvam).
  3. 0:50 to 1:10, the oversell button: one accepted, one refused.
  4. 1:10 to 1:35, change a value in the Flagsmith dashboard, show the app respond with no deploy.
  5. 1:35 to 2:00, trigger the failure, approve in NudgeBee, health goes green.
- **A 60-word submission description.**

## 9. Honesty rules

- Anything simulated is labelled as simulated in the UI and README. Never present a fixture as a live sponsor call.
- No claims of revenue saved, accuracy improved, or experiments won.
- Finish with a handoff: how to run it, which integrations you verified live, what is unverified, what I must do before recording.
