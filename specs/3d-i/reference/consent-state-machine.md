# Consent State Machine Reference

Three tiers per channel · independent per channel · explicit transitions only.

```
                  ┌───────────────────────┐
                  │                       │
                  ▼                       │
              ┌──────┐                    │
       ┌─────►│ OFF  │◄───────────────────┤
       │      └──┬───┘                    │
       │         │                        │
       │  user clicks "Session only"      │
       │         │                        │
       │         ▼                        │
       │     ┌──────────┐                 │
   tab close │ SESSION  │──user clicks────┤
       │     └──┬───────┘  "Always enable"│
       │        │                         │
       │        │                         │
       │        ▼                         │
       │     ┌────────────┐               │
       │     │ PERSISTENT │───user clicks─┘
       │     └────────────┘  "Revoke"
       │             │
       └─── reload ──┘
            (persists)
```

## Storage Strategy

| Tier        | Storage          | Lifetime         |
|-------------|------------------|------------------|
| Off         | NO storage entry | (none)           |
| Session     | sessionStorage   | until tab close  |
| Persistent  | localStorage     | until revoked    |

## Storage Keys

```
localStorage["acu-master-ops:consent:v1"] = {
  "face2feel": { "tier": "persistent", "grantedAt": "...", "grantedVersion": "v1" },
  "voice2feel": { ... },   // arrives in 3d-ii
  "touch2feel": { ... }    // arrives in 3d-iii
}

sessionStorage["acu-master-ops:consent:v1:face2feel"] = { tier: "session", ... }
```

## Resolution Algorithm

```typescript
function getEffectiveTier(channel): ConsentTier {
  // 1. Check localStorage for persistent
  const persistent = localStorage["acu-master-ops:consent:v1"]?.[channel]?.tier;
  if (persistent === "persistent") return "persistent";
  
  // 2. Check sessionStorage for session
  const session = sessionStorage["acu-master-ops:consent:v1:" + channel]?.tier;
  if (session === "session") return "session";
  
  // 3. Default off
  return "off";
}
```

## Revoke Side Effects

```typescript
function revoke(channel) {
  // 1. Clear both storage entries
  delete localStorage["acu-master-ops:consent:v1"][channel];
  sessionStorage.removeItem("acu-master-ops:consent:v1:" + channel);
  
  // 2. Stop active MediaStream tracks (if any)
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
  }
  
  // 3. Terminate worker
  if (activeWorker) {
    activeWorker.postMessage({ type: "SHUTDOWN" });
    activeWorker.terminate();
  }
  
  // 4. Remove Sentinel dot from DOM (React unmount via state change)
  
  // 5. Clear in-memory PATHOS deltas from this channel
  // (computePATHOS naturally falls back to NEXUS-only)
}
```

## Cross-channel Independence

- Granting Face2Feel does NOT grant Voice2Feel
- Revoking Face2Feel does NOT affect Voice2Feel or Touch2Feel
- Each channel has its own UI card in /master-ops/settings/biometrics

## Migration Path (future)

If we ever need to migrate consent records, bump `grantedVersion` from `v1` to `v2`:
- v1 records remain valid for read
- Write operations always create v2 records
- v1 records auto-upgraded on next user interaction
