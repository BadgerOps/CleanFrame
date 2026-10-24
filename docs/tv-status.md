# Reference TV and verification status

Recorded through 24 October 2026. These results describe the maintainer's TV. Other models, firmware and operating systems need their own checks. Repo-only work must not contact the TV.

## Hardware and OS

| Item | Reference setup |
| --- | --- |
| TV | Samsung 75-inch The Frame, QN75LS03DDFXZA / LS03D |
| Firmware | 1400.1; firmware string T-PTMDAKUC-1400.1 |
| OS and architecture | Tizen 8.0.0, ARMv7 / 32-bit ARM, confirmed by a native probe |
| Native helper environment | SDK user UID 901, .NET 6 runtime and required native libraries confirmed on this TV |
| Web engine | Exact Chromium/WebKit version has not been recorded; keep runtime ES5-compatible |

Developer Mode is enabled. The developer connection needed a full mains power cycle after enabling it. Network address, device identifier, signing material and diagnostic dumps are private local configuration.

## Current app and identity

CleanFrame 0.6.2 was signed, installed in place and launched on 24 October. The SDK reported installation complete, retained the app in its installed list and returned a successful launch. Its author certificate exactly matches the prior signed build, and the application identity stayed stable. Version 0.6.2 keeps the registered Home process alive during app handoff instead of exiting it 250 ms after Tizen accepts a launch.

- Package: `BadgrFrm01`
- Application: `BadgrFrm01.CleanFrame`
- Display name: `CleanFrame`

The current interface has List and Dock, independent appearance choices, an app editor, grouped Settings and fifteen wallpapers. Public builds contain Manrope, Geist and Newsreader. The public-source cleanup changed neither the installed widget nor the native configuration.

## Physically confirmed

The maintainer confirmed that the custom interface appears, opens Netflix and YouTube using the normal remote, and opens Other apps. The physical Home button from Netflix returns to CleanFrame. Netflix handles repeated Back inside its own app; an exit destination was not observed.

Netflix uses `org.tizen.netflix-app`. YouTube uses `9Ur5IzDKqV.TizenYouTube`, with `com.samsung.tv.cobalt-yt` as a fallback. These IDs came from this TV's installed-app list. Other TVs must discover their own IDs.

## Pending physical checks

The 0.6.2 installation and launch responses are command evidence. After installation, TizenTube stayed running and visible for a 20-second status observation and Jellyfin for a 30-second observation, without a restart or visibility loss. The exact remote-driven tile handoff still needs physical confirmation because the TV's remote-control authorization was not granted during that test. Current rendering, fonts, expanded catalogue, Settings and remote feel also need physical observation. Also pending are native Art Mode's destination, TV settings, corrected Samsung Home escape through `com.samsung.tv.csfs`, and normal power-on after streaming or Art Mode.

Browser and package checks establish source behaviour and archive contents. CPU-throttled Chromium timings are development comparisons; they are not TV benchmarks. Current browser checks are described in [testing](testing.md).

## Native Home and recovery

Native Home was configured separately on 19 October. A guarded one-shot helper ran as the SDK user. Original typed values were saved privately before apply; exact-value restore/readback and reapply passed. The latest recorded readback assigns CleanFrame to Home. Startup and boot-backup remain `org.tizen.tv-viewer`, and Smart Hub Home autostart is disabled.

Preserve this configuration and `.local/native-home/original.json`. Restore the original Home/startup values before uninstalling CleanFrame or changing its identity. The maintained command is `python3 scripts/native-home/run.py restore`; use it only in an explicitly authorised TV task. The earlier last-app-resume menu experiment does not describe the current native assignment.

The helper uses undocumented native operations, guarded for the reference identity and firmware. Its source is in `scripts/native-home/`; compiled tools, original values and diagnostics stay private. See [development](development.md), the [setup guide](agent-tv-setup-guide.md) and the [native helper notes](../scripts/native-home/README.md).

Implementation reference: [S90D firmware 2130 native Home work](https://github.com/splitcipher/couchroot/blob/83906b468836869933012da03a4018fb339462b3/docs/devices/s90d/README.md). That is a different model; it does not establish compatibility with another TV.
