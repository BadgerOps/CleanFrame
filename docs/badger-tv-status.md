# Badger Frame device record

Recorded 20 October 2026 for the private fork deployment.

| Item | Confirmed value |
| --- | --- |
| TV | Samsung The Frame `QN75LS03DDFXZA`, platform `24_PONTUSM_FTV` |
| Firmware | `T-PTMDAKUC-1400.1`, build `TIZEN-TRUNK2024-PontusM-HOTFIX-RELEASE_20260120.1` |
| Runtime | Tizen 8, 32-bit ARM, .NET 6 |
| CleanFrame package | `BadgrFrm01` |
| CleanFrame application | `BadgrFrm01.CleanFrame` |
| Jellyfin application | `AprZAARz4r.Jellyfin` |
| TizenTube application | `xvvl3S1TT1.TizenTubeStandalone` |
| Samsung Home escape | `com.samsung.tv.csfs` |
| Art Mode target | `org.tizen.art-app` |

The signed web widget installed and launched successfully. The owner confirmed that the CleanFrame screen rendered on the TV. Native Home assignment is maintained separately through the guarded helper in `scripts/native-home/`; its recovery baseline and output remain under ignored `.local/native-home/`.

## TizenTube proxy and possible guiltyspark migration

TizenTube Standalone includes its proxy on the TV; it is not currently a
service on `guiltyspark`. Package `xvvl3S1TT1` registers
`xvvl3S1TT1.StandaloneService`, whose installed executable and bundled source
are under `/opt/usr/apps/xvvl3S1TT1/`. The unminified source lives upstream in
[`standalone/service`](https://github.com/reisxd/TizenTube/tree/main/standalone/service).
The Cobalt proxy implementation is
[`standalone/service/utils/cobaltProxyServer.js`](https://github.com/reisxd/TizenTube/blob/main/standalone/service/utils/cobaltProxyServer.js).

The Cobalt build listens on TCP 8101 on all TV interfaces. It is an
unauthenticated HTTP CONNECT proxy. For hosts outside `youtube.com` it creates
a normal tunnel; for YouTube it performs TLS interception and injects the
TizenTube userscript into the YouTube TV page. Its locally generated CA and
private key are `/home/owner/share/tizentube-ca.crt` and
`/home/owner/share/tizentube-ca.key`. The setup code copies the CA certificate
into TizenTube's private Cobalt trust store under
`/home/owner/share/tizentube-content/ssl/certs`.

The installed alternate WGT passes `--proxy=http://tizentube:8101` to Cobalt.
Internal DNS currently resolves the bare `tizentube` name to the TV's reserved
wired address. This avoids the loopback-isolation failure seen with the default
`127.0.0.2:8101` build. Keep the address and MAC in private infrastructure
configuration rather than copying them into this repository.

If the proxy is moved to `guiltyspark`, retain the `tizentube` hostname so the
installed WGT does not need another launch-argument change. The implementation
should:

1. Package the proxy and its pinned Node dependencies as a dedicated NixOS
   service or rootless container. Refactor the Tizen-specific setup paths out
   of the server entry point instead of running the whole WGT service on Linux.
2. Bind TCP 8101 only to `guiltyspark`'s media address. Permit the TV's reserved
   address as the sole source in the host firewall. Do not expose it as a
   general LAN proxy: it has no authentication and forwards arbitrary CONNECT
   destinations.
3. Generate a dedicated proxy CA on `guiltyspark`, keep its private key in a
   root-readable SOPS-managed secret or persistent service directory, and
   install only its public certificate in the TV's copied Cobalt trust store.
   Reusing the TV-generated CA would require exporting its private key and is
   the less desirable migration path.
4. Change the `tizentube` DNS answer on both resolvers from the TV to
   `guiltyspark` and deploy both resolvers together. Do this only after the
   server is healthy and the TV trusts its CA.
5. Verify a CONNECT request from the TV, then launch TizenTube and confirm the
   Cobalt command line still names `http://tizentube:8101`, the TizenTube menu
   is present, playback starts, and a known ad-heavy video has no pre-roll.
6. Preserve rollback: point `tizentube` back to the TV and restart
   `xvvl3S1TT1.StandaloneService`. The existing WGT and local proxy remain the
   recovery implementation unless deliberately removed later.

This proxy is useful specifically because it injects TizenTube into
`youtube.com/tv`. It is not a practical network-wide YouTube blocker: ordinary
browser and mobile clients do not use that page, every client would need to
trust the interception CA, and native applications may pin certificates.

The native Home workflow was tested as a full query, apply, exact restore, and reapply cycle. The immediate readback assigned both the native Home operation and `db/appfw/home_appid` to `BadgrFrm01.CleanFrame`, enabled its autostart flag, and retained the original `org.tizen.tv-viewer` startup application. A later readback found that the firmware had asynchronously rewritten `db/appfw/startup_appid` to `BadgrFrm01.CleanFrame`. The helper retries restoration for this reason. See [Badger Frame recovery](badger-tv-recovery.md) for the exact original values and recovery sequence.

Changing the Home target does not stop Samsung's original Home process. On this firmware, `com.samsung.tv.csfs` is marked for preload and remains resident with background launch enabled. The Tizen web runtime and other platform services also remain active. TizenTube additionally keeps Samsung's Cobalt/YouTube runtime available. CleanFrame changes which application handles Home; it does not replace or remove the underlying firmware services.

On 20 October 2026, selected Home children, preview/quick-panel applications and Prime Video were disabled through the package manager's per-application disable flag. Each Samsung child was changed separately, followed by a reboot and explicit launch test. The three Prime Video entries were changed together because they belong to one package. The database passed `PRAGMA integrity_check`; Samsung Home and CleanFrame continued to launch after every checkpoint. No package files were removed.

The disabled application IDs are recorded in [Badger Frame recovery](badger-tv-recovery.md), together with the targeted rollback transaction. AirPlay, Netflix and Apple TV remain enabled. `com.samsung.tv.coba.multiscreen` also remains enabled; it was not treated as the tested `com.samsung.tv.multiscreen` child.
