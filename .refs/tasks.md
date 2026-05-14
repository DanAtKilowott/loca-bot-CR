# Gamerminds Discord Bot — Task List

> **Source of truth:** [Kilowott - Gamerminds - Discord bot call - 2026_05_07 12_28 IST - Notes by Gemini.md](Kilowott%20-%20Gamerminds%20-%20Discord%20bot%20call%20-%202026_05_07%2012_28%20IST%20-%20Notes%20by%20Gemini.md)
>
> **Deadline:** First week of June 2026 (per Leon).
> **Hosting:** Stays on Render — no infrastructure changes.
> **Testing:** Private channel on Leon's existing server.

---

## Critical Product Constraint — Hide Vote Counts

From the call: Leon does **not** want vote counts publicly visible.

> *"There's another linguist or like another company... they see the votes and they use this data for themselves... even the developers... this is basically free marketing research for them."*

Implications for every task below:
- **No public command may reveal exact vote counts** (or even precise rankings if rankings effectively leak counts).
- Reactions/emote counts on the post are fine — those are user expressions, not bot output.
- All vote totals stay in the Google Sheet (admin-side) and in admin-only bot output.
- Any "trending" or "top" feature must respect this — show *which* games are popular by ordering, but **not the numbers**.

---

## 1. Channel Consolidation (routing-only, no Discord channels deleted)

**Goal per Leon:** *"I really just want game requests, new submissions, and that's that."*

Target = **2 active channels** for the bot:
- `game-requests` — every active game lives here
- `new-submissions` — entry point for fresh requests

The 5 other channels (`rising-games`, `popular-requests`, `approved-list`, `trending-games`, `archived-games`) stay on the server but **receive no bot writes**.

- [ ] Stop routing to `rising-games`, `popular-requests`, `approved-list`, `trending-games`, `archived-games`
- [ ] Remove `RISING_CHANNEL_ID`, `POPULAR_CHANNEL_ID`, `APPROVED_CHANNEL_ID`, `TRENDING_CHANNEL_ID`, `ARCHIVED_CHANNEL_ID` reads from [index.js:31-77](index.js#L31-L77); strip from [.env:16-30](.env#L16)
- [ ] Rework `postToGameChannel` ([index.js:682-1090](index.js#L682-L1090)) so all games post to `game-requests` and stay there
- [ ] Delete the "move post between channels on status change" logic — posts now edit in place
- [ ] Delete `updateGameMomentum`, `postWeeklyTrending`, the rank map at [index.js:700](index.js#L700)
- [ ] Delete `RISING_THRESHOLD` / `POPULAR_THRESHOLD` / `TRENDING_CHANNEL_ID` env vars
- [ ] **Keep statuses as concepts** in the data layer (Active / Archived) so `/reset` and exports still work, but don't surface "Rising/Popular/Trending" anywhere user-facing

**Open question — archive logic:** Leon said *"the archived games is fine"* but then *"maybe just reduce it to two is good enough."* Two options:
- **Option A (recommended, matches the literal "two channels" ask):** Auto-archive removes the post from `game-requests` entirely after N days of no votes. Data stays in the Sheet. No archive channel.
- **Option B:** Keep `archived-games` channel as a third bot-writable channel for low-activity cleanup.

→ **Confirm with Leon.**

---

## 2. Single-Step Submission

**Goal per Leon:** *"I would like to have it just as one [step]."*

- [ ] Collapse `buildSubmissionModal1` + `buildSubmissionModal2` into one modal builder ([index.js:67-256 area](index.js#L67))
- [ ] Replace language **dropdown** with a **TextInput** (Discord modals don't support StringSelect inside ModalBuilder — that's why the previous developer split into 2 steps)
- [ ] Move the payment question into the same modal (it currently lives in step 2)
- [ ] Delete the "continue to step 2" button handler
- [ ] Delete the `pendingSubmissions` Map at [index.js:280](index.js#L280) — also fixes an unbounded memory leak flagged in code review
- [ ] Validate the language text input (non-empty, length cap, optional comma-split for multiple languages)
- [ ] End-to-end test: submit → appears in `new-submissions` → vote → vote recorded in Sheet

---

## 3. Filtering / Sorting Help

**Goal per Leon:** make popular games discoverable without exposing vote counts.

- [ ] Post a pinned message in `game-requests` explaining how users can filter the channel by game name (Discord's built-in channel search). One-time manual post, written by Leon.
- [ ] **Optional / depends on Leon's decision:** Admin-only `/top` slash command that lists top N games by vote count — restricted to admin role so the data stays private. Public users get no equivalent.
- [ ] Leon explored "filter the top highest games put them on top" — note that the Discord API doesn't let bots reorder threads. Documented in "Out of Scope" already.

**Open question:** Does Leon want an admin-only `/top`, or is the Sheet enough for his own visibility?

---

## 4. Admin Reset Command

**Goal per Leon:** *"I need a way to reset the bot easily... I need to have a clean sheet when I go proper live."*

- [ ] Add `/reset` slash command, admin role check (reuse existing admin command pattern)
- [ ] Two-step confirmation: ephemeral message with a confirm/cancel button pair, 30-second timeout
- [ ] On confirm:
  - Clear in-memory `gameCache` and `voteCache`
  - Wipe data rows in Games and Votes worksheets via `clearRows()` (preserve header rows)
  - Delete bot posts from `game-requests` and `new-submissions` (best-effort; Discord 14-day-old delete limit applies)
  - Log admin user ID + ISO timestamp to an "audit" tab on the Sheet before wiping
- [ ] Verify the Google service account has **edit** permission on the Sheet (not just append)
- [ ] **Open question:** does `/reset` also clear blacklist + `submissionTracker`, or only game/vote data?

---

## 5. Auto Data Export at 100 Votes

**Goal per Leon:** *"As soon as a game reaches 100 votes... it gives me proper cleaner data for this one."*
**Destination:** *"It doesn't matter where it is. I just need to export it... showcase to the developer."* → **Not blocked.** Recommend: new tab in the same Sheet (matches Leon's first-instinct phrasing *"automatically creates a new tab"*).

- [ ] Hook threshold check into `addVoteToExistingGame` ([index.js:601-654](index.js#L601-L654)); fire when vote count crosses 100
- [ ] Generate clean summary tab in the Sheet, one tab per qualifying game:
  - Game title, Steam link, Steam appID
  - Requested language(s)
  - Platform breakdown
  - Vote totals (overall + per-language if multi-language requested)
  - Pay-stat breakdown (the "how much would you pay" answers)
  - Submission timestamps (first and most recent)
- [ ] Idempotency: add an `Exported` column on the Games sheet, set to `true` after first export so the threshold fires once, not on every vote past 100
- [ ] Format the tab to be developer-presentable (Leon's stated end use: pitch to the game's developer)

---

## 6. Bug Fixes & Code Cleanup

- [ ] **Rising/popular threshold bug** (Leon: *"Hollow Knight had a bit more votes but it didn't go to rising games"*) — **likely evaporates with Task 1** since the channels go away. Verify after Task 1 lands.
- [ ] Remove dead code and orphan handlers left over from Tasks 1 and 2
- [ ] Remove unused env vars from `.env` and stale comments
- [ ] Remove `fast-fuzz` from [package.json:25](package.json#L25) — declared but never imported
- [ ] Fix typo `"specfied"` in [package.json:8](package.json#L8)

---

## 7. Reliability & Correctness (added from code review — not in Leon's notes, but pre-existing bugs worth fixing before launch)

These weren't in the call but are user-visible enough to fold into a pre-launch sweep.

### 7a. Critical: concurrency races on Sheets writes
- [ ] Add a per-process write mutex (e.g. `p-queue` size 1) around `createNewGame`, `addVoteToExistingGame`, and the admin merge path
  - Fixes duplicate `Game_ID` race at [index.js:589-596](index.js#L589-L596)
  - Fixes double-vote race at [index.js:455-460](index.js#L455-L460)
  - Fixes partial-state risk in admin merge at [index.js:1568](index.js#L1568)

### 7b. High: state lost on restart
- [ ] Persist `submissionTracker` ([index.js:274](index.js#L274)) — to the Sheet or to disk — so the daily submission cap can't be bypassed by restarting on Render
- [ ] Add TTL/cleanup so the Map doesn't grow forever

### 7c. High: Sheets API failure handling
- [ ] Add retry with exponential backoff on Sheets API calls (handle 429s and transient 5xx)
- [ ] Stop swallowing errors in `refreshCache` ([index.js:390-414](index.js#L390-L414)) — log and surface to admins

### 7d. High: channel-wide message delete is too aggressive
- [ ] `MessageCreate` handler at [index.js:1378-1394](index.js#L1378-L1394) deletes **every** non-thread user message in 6 channels including admin/mod messages
- [ ] Gate on role check (skip mods/admins) or restrict to specific channels
- [ ] After Task 1, this should target only `game-requests` and `new-submissions`

### 7e. High: null deref on `Requested_Languages.split('|')`
- [ ] Defensive `(x || '').split` at [index.js:733](index.js#L733), [853](index.js#L853), [1018](index.js#L1018), [1529](index.js#L1529)
- [ ] After Task 2 the single-language text input will likely change this field's format — coordinate

### 7f. High: weak Steam URL validation
- [ ] Tighten [index.js:1695-1697](index.js#L1695-L1697) to require `https://store.steampowered.com/app/<digits>` — currently accepts any Steam URL

### 7g. Medium: process safety
- [ ] Add `unhandledRejection` / `uncaughtException` handlers near [index.js:1813-1817](index.js#L1813-L1817)
- [ ] Drop privileged `GuildMembers` intent at [index.js:266](index.js#L266) if `members.fetch` works without it

---

## Suggested Execution Order

1. **Task 1** — channel consolidation (biggest deletion; unblocks Task 6)
2. **Task 2** — single-step modal (independent; also a deletion)
3. **Task 7a** — write mutex (small change, fixes 3 critical races before launch)
4. **Task 7d, 7e, 7f** — quick correctness fixes
5. **Task 6** — sweep dead code from 1 & 2
6. **Task 4** — `/reset` (Leon needs this to go live with clean data)
7. **Task 5** — auto export at 100 votes
8. **Task 3** — filter pin + optional admin `/top`
9. **Task 7b, 7c, 7g** — reliability hardening

---

## Out of Scope

- Auto-sorting / reordering Discord threads by vote count — Discord API doesn't support it
- Deleting any Discord channels — Leon will adjust channel permissions on the server side himself
- Migrating off Google Sheets to a real database — most reliability issues stem from Sheets being non-transactional, but this is out of scope for the June deadline

---

## Assumptions

- Language field becomes a free-text input, not a dropdown
- Channels stay on the server — bot just stops routing to consolidated-away ones
- Bot continues on Render — no infrastructure changes
- Testing happens in a private channel on Leon's existing server
- Vote counts remain hidden from non-admin users at all times (see Critical Product Constraint above)

---

## Open Questions for Leon

1. **Archive channel:** drop entirely (Option A — match the literal "two channels" ask, archive only in the Sheet), or keep `archived-games` as a third bot-writable channel?
2. **Admin `/top` command:** useful, or is the Sheet enough for your own visibility?
3. **`/reset` scope:** game/vote data only, or also blacklist + daily submission tracker?
4. **100-vote export:** confirm new tab in the same Sheet is the right destination (your first instinct in the call).
5. **Statuses internally:** OK to keep Active/Archived only and drop Rising/Popular/Approved/Trending entirely from the data model?
