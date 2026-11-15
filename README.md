# WILD-AI

Offline Android field assistant for Uttarakhand. This repository is an early
React Native build, not a field-ready safety product.

See the [v1 architecture](ARCHITECTURE.md) for the pilot design and release
gates.

For a clean checkout, follow the [Windows and Linux setup guide](SETUP.md).

## Current build

- A focused chat screen with a living, animated forest canopy and drawer for
  regions, saved conversations, downloads, contacts, and feedback. Motion
  respects Android's reduced-motion setting.
- Conversations and attached photos persist in app-private storage. Recent
  text turns provide context to a configured online model; photos stay local.
- Manual selection of Uttarakhand or one of its 13 districts.
- Offline source-backed retrieval over 25 plant occurrence records, five
  limited fruit food-use records, and six field topics. The [source ledger](CONTENT_SOURCES.md)
  lists the roster and coverage. It never certifies a found plant as edible.
- Emergency-contact answers use official sources. Each district's local
  control-room numbers appear only when that district is selected.
- Emergency contacts are in the drawer without needing a question.
- Explicit abstention when a topic or local area has no record, or when a user
  asks for identification, toxicity, or medical guidance.
- Camera and gallery attachment. The pilot build includes an experimental
  12-species photo model that can abstain and collect feedback. Release builds
  do not include this unvalidated model.
- Users can report a missing or incorrect answer. Reports keep the exact query,
  region, answer, and note on the phone; the Saved feedback screen can share
  them as JSON for later review. Feedback is never uploaded automatically.
- General questions without an offline match can show linked, unreviewed
  Wikipedia summaries. Identification, edibility, toxicity, and medical safety
  questions stay in the local path.
  Users can download short notes for a selected region and up to three locally
  documented species. These notes persist offline and are shown separately
  when a related offline query has no reviewed answer. They are not maps or
  verified safety guidance.
- A pilot model service can summarize online sources with a hosted open-weight
  model. The operator configures its address and pilot code before building the
  APK. The provider key stays on the service. Model answers are labelled
  unreviewed; safety questions are blocked from model summarization.
- The Android app requests Internet permission for these features.
  Offline curated answers, contacts, and saved notes remain available without
  a network connection.
- The standalone arm64 pilot APK is at
  `android/app/build/outputs/apk/pilot/app-pilot.apk`. It includes the candidate
  model and JavaScript bundle, runs without Metro, uses the generated debug
  signing key, and must not be uploaded to Google Play.

The contact information was checked against the
[Uttarakhand State Disaster Management Authority](https://usdma.uk.gov.in/)
and its [district control-room list](https://usdma.uk.gov.in/eocs-contact/)
on 2026-10-25. Domain review and field validation are still required.

## Run checks

```sh
npm ci
npm test -- --runInBand
npm run lint
npx tsc --noEmit
npm run test:server
```

The local Android SDK is in ignored `.android-sdk/`. For native builds from
`android/`, set `ANDROID_HOME` to that directory and `GRADLE_USER_HOME` to
ignored `.gradle-user-home/`, then run `./gradlew assembleDebug` or
`./gradlew assembleRelease`. The release build is unsigned by default; a
separate Play signing key is required before distribution.

Build the standalone pilot with
`./gradlew :app:assemblePilot -PreactNativeArchitectures=arm64-v8a`.

The updated standalone chat APK was installed and launched on a Samsung
SM-S911B with Metro stopped. A local answer and an experimental photo result
remained in the conversation after force-stopping and restarting the app. The
photo model abstained on a non-plant image, as expected. Plant accuracy,
latency, and memory still need measurement with real field photos.

## Pilot online model service

`server/online-service.mjs` retrieves Wikipedia excerpts and asks NVIDIA's
hosted `openai/gpt-oss-20b` endpoint to summarize only those excerpts. To
configure it for a pilot:

1. Join the [NVIDIA Developer Program](https://docs.api.nvidia.com/nim/docs/product),
   choose the [free prototype endpoint](https://build.nvidia.com/openai/gpt-oss-20b),
   and generate an API key.
2. On a server you control, set `NVIDIA_API_KEY`, `PILOT_ACCESS_CODE` (a random
   short-lived code), and optionally `NVIDIA_MODEL=openai/gpt-oss-20b` and
   `PORT=8080`. Start `node server/online-service.mjs` behind an HTTPS reverse
   proxy. Keep the NVIDIA key on the server.
3. Set `pilotServiceUrl` and `pilotAccessCode` in `src/pilotConfig.ts`, then
   build and distribute a new pilot APK. Participants enter no URL or key. The
   pilot code is extractable from an APK, so enforce server quotas, monitor
   usage, and rotate it after the small pilot. Never put `NVIDIA_API_KEY` in the
   app.

The service limits each IP to 20 requests per hour. It sends the question,
selected region, recent text turns, and Wikipedia excerpts to NVIDIA. Photos
stay on the phone. NVIDIA's free hosted access is for prototyping and testing;
[production use requires a commercial license](https://docs.api.nvidia.com/nim/docs/product).
No HTTPS host or NVIDIA key is configured yet, so this build uses the offline
pack and limited direct Wikipedia fallback. Add a public operator contact to
the Wikimedia User-Agent before wider distribution.

## On-device text model

The chat and full history work offline without a text LLM. A downloadable
on-device summarizer is feasible, but the current [Gemma 3 1B LiteRT model](https://developers.google.com/edge/litert-lm/overview)
is about 1 GB, which is a substantial addition to the 123 MB pilot APK and
needs speed, memory, battery, and answer-safety testing on mid-range phones.
It is not bundled in this pilot. The online service uses recent turns as
conversation context; older messages remain visible on the phone.

## Next release gates

1. Review and version region-specific guidance with qualified experts.
2. Evaluate retrieval and abstentions against labelled in-scope and
   out-of-scope questions. Consider semantic retrieval only if it improves
   recall without unsafe matches.
3. Expand the remote-trained photo model from 12 to 20–30 reviewed species
   and calibrate it against independent regional field photos. No model
   training runs on the phone.
4. Evaluate unknown plants, look-alikes, harmful errors, latency, memory, and
   fresh-install offline use before a Google Play closed field pilot. Check
   online answers separately for unsupported claims and misleading sources.

The [Colab dataset contract](training/DATASET.md) and
[training notebook](training/WILD_AI_Colab.ipynb) are ready for remote training.
The [25-species candidate roster](training/SPECIES_CANDIDATES.md) is a
research shortlist awaiting botanical review and photo curation.
The candidate photo review package is in `training/output/`; the user has
visually reviewed it. The stronger model from the [Colab experiments of 25 October](training/MODEL_EXPERIMENT_2026-10-25.md)
is bundled in pilot and debug builds only. It still needs expert label review and
independent field evaluation before release.
