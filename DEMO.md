# MithaiFlow — two-minute demo

## Before recording

- Use `npm run build` and `npm start` for a clean preview without development tools.
- Open the storefront at phone width and the protected shop desk in another tab.
- Check `docs/evidence/integrations.json`. Do not describe an unconfigured sponsor as live.
- Check tomorrow's date and ensure there is at least 500 g of kaju katli available. Use another stocked product if necessary; do not reset somebody else's work.
- The isolated last-kilo test creates its own fixture and does not touch shop stock.
- Configure Flagsmith and the NudgeBee workflow before filming their live sections.
- Have the public tunnel running and `APP_BASE_URL` set correctly.
- Keep `.env`, API keys, browser account menus, and unrelated projects out of the recording.

## 0:00–0:15 — the problem

“During the festive rush, a sweet shop can promise the last kilo twice—once at the counter and once over the phone. MithaiFlow gives both channels the same stock ledger.”

Show the storefront and available stock. Explain that the shop data is fictional.

## 0:15–0:50 — Sarvam and an exact promise

Speak: **“कल शाम छह बजे आधा किलो काजू कतली चाहिए।”**

Show the editable Sarvam transcript, then select **Understand order**. Confirm the visible 500 g, ₹600 and absolute pickup date/time. Enter a name, check the quote, then confirm. The receipt appears immediately; the flash spoken readback begins independently. Use the audio controls if browser autoplay is blocked.

Fallback for noisy rooms: type the same sentence. Say that it is typed input, not a microphone demonstration.

## 0:50–1:10 — one kilo, one commitment

In the shop desk, select **Run oversell test**.

“This counter sale and online preorder are racing for one isolated kilo. One succeeds, the other is refused. The stock cannot be promised twice.”

Show both outcomes and the pass result. A short live run is evidence of that run, not a throughput benchmark.

## 1:10–1:35 — Flagsmith does real work

Show the actual Flagsmith dashboard. Turn `accepting_orders` off. After the cache/poll refresh, new quotes are paused while the existing receipt stays readable. Restore the flag.

Optional substitute: demonstrate the regular/new voice segment in two independent sessions as described in README.md.

Do not present the local rehearsal switches as Flagsmith.

## 1:35–2:00 — NudgeBee approval and recovery

Start the labelled controlled checkout failure. Show the actual NudgeBee execution: health is degraded, approval is requested, approval is granted, the protected recovery call succeeds, and final health is healthy.

“The failure is a controlled exercise. The NudgeBee approval workflow and recovery request are real. Existing orders remain intact.”

If the workflow is not configured, say so and show the local rehearsal only as local. Do not claim a complete three-sponsor integration.

## Close

“The counter, the assistant and the customer agree on the same achievable order. Every sweet promise, kept.”

## Submission description — 60 words

MithaiFlow helps neighbourhood sweet shops keep festive preorder promises. Customers speak Hindi or English, review an exact order, and reserve stock with pickup capacity. Counter sales share the same transactional ledger, preventing double commitments. Sarvam powers speech, Flagsmith controls shop policies, and NudgeBee supports approved recovery. Our demo proves one kilo cannot be promised twice across channels during festive rushes.

Only use that description after all named sponsor paths are verified. Otherwise describe NudgeBee as prepared for configuration.

## Social post draft

The hardest part of our AI demo? Making sure it cannot promise the same kilo of mithai twice.

At Festive Hacks in Bengaluru, I’m building MithaiFlow for a familiar festive headache: a shop’s last stock gets promised at the counter and again over the phone.

Our approach is simple: let customers speak in Hindi or English, show the exact quantity, price and pickup, then reserve from the same stock ledger the counter uses.

The moment I want to show: two requests race for the last kilo. One gets a confirmed promise. The other gets an honest answer.

Building with Sarvam AI, Flagsmith and NudgeBee at WeMakeDevs × WeAreDevelopers. Every sweet promise, kept. 🪔

#FestiveHacks #BuildInPublic #AIForIndia

Before posting, replace sponsor/organiser names with their actual LinkedIn mentions (or verified X handles). The WhatsApp announcement requires all hackathon sponsors and WeMakeDevs to be tagged. Attach a real venue photo and a short clip of the race; do not claim a finished integration that has not been verified. Nothing has been published automatically.
