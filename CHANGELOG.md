# Changelog

All notable changes to `@jamolpe88/dsh-deepseek-peakoffpeak` are documented here.

## 0.1.1 — 2026-10-27

- Fixed the centered pill group when a model change adds or removes a pill: a pill that mounted while hidden now joins the group as soon as it becomes visible, so the pills recenter immediately instead of overlapping until the session is reopened.
- README: added the npm downloads badge.
- No other runtime changes.

## 0.1.0 — 2026-10-27

- First release.
- Live 24-hour peak / off-peak bar in the composer, computed from the user's local day with the official UTC windows (`01:00–04:00` and `06:00–10:00`, Monday to Friday).
- Compact pill with the DeepSeek mark and a small clock, the active band, the time left and the current-time marker.
- Details window with the band and countdown, local time and zone, the day's 24-hour bar, and the official USD prices per 1M tokens for V4.1 Flash and V4 Pro with the active column tinted green or warm.
- Provider-agnostic visibility: any DeepSeek model, whether it comes from `deepseek-official`, `deepseek-account`, `opencode-go` or an aggregator.
- Joins the centered composer pill group shared with the other JaMoLpE88 plugins; the group hides together when it does not fit.
- Zero configuration: no API, no credentials, no settings page and no local storage. Chinese public holidays are not excluded, as stated in the window.
