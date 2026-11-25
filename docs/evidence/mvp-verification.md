# MVP verification

Verified locally on 25 November 2026 using Node.js 24.18.0, SQLite, Prisma 6.19.3, and Next.js 16.4.6.

## Checks completed

- TypeScript check passed.
- All four required automated tests passed against the separate `core-test.db` database. The first test contains 12 race rounds alternating two-preorder competition and counter-versus-preorder competition.
- The production build passed and generated `/`, `/shop`, `/o/[id]`, and `/api/[...path]`.
- The storefront was inspected in a desktop browser and at a 390 × 844 mobile viewport.
- A browser checkout created a real sample reservation for 500 g kaju katli, ₹600, 26 November at 6 PM IST. Displayed availability changed from 1 kg to 500 g. The quote required a separate confirmation step.
- The protected shop desk showed the order and reserved balance after password sign-in.
- The shop desk's isolated cross-channel race showed one accepted preorder and one rejected counter sale. That particular run reported 66 ms. This is a single demonstration observation, not a throughput benchmark.
- A controlled local checkout failure showed degraded health. The explicitly labelled local recovery rehearsal restored healthy state. This does **not** prove a NudgeBee approval workflow.

## Clean-checkout verification

A fresh local clone installed from the lockfile, generated its own private configuration, applied both migrations, seeded an empty SQLite database, and passed the production build. Its server then ran on a separate local port. Catalogue lookup, a ₹600 quote, confirmation, same-key replay, receipt lookup, and unauthenticated recovery rejection (401) all passed. No live sponsor credentials were copied into that checkout.

## Live provider evidence

See [integrations.json](integrations.json) for the latest actual requests. Sarvam TTS, STT and correction-aware order interpretation passed. The TTS-to-STT check used synthetic audio. Human microphone accuracy and noisy venue performance remain unmeasured.

The initial observed TTS request took 11,133 ms with the original model; one later flash-model request took 6,750 ms. The associated later STT and interpretation requests took 937 ms and 244 ms. These were separate observations with different timing conditions, not a controlled comparison or a latency guarantee.

## Remaining external checks

- Flagsmith live environment read and remote-toggle/segment behaviour need the environment key and actual configured features.
- NudgeBee webhook delivery, in-app approval, recovery callback, and final health verification need the real workflow and public tunnel.
- The current report explicitly labels unconfigured services. A configured webhook alone must not be reported as a completed approval workflow.

Private sponsor-dashboard captures are outside the repository. `.env`, root PNGs, local databases, and `.next` are ignored by Git.
