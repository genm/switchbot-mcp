# Migration Guide: v1 -> v2

## Breaking changes

- Package version is now `2.0.0`.
- Tool names were fully replaced (no backwards compatibility aliases).
- Tool responses now include `structuredContent` as the primary machine-readable output.
- HTTP transport requires `MCP_SERVER_API_KEY` (`Bearer` auth).

## Tool mapping

| v1 tool | v2 tool |
| --- | --- |
| `list_devices` | `switchbot_list_devices` |
| `get_device_status` | `switchbot_get_device_status` |
| `control_device` | `switchbot_set_power` or `switchbot_send_command` |
| N/A | `switchbot_list_scenes` |
| N/A | `switchbot_execute_scene` |

## Input/output updates

### v1 `control_device`

```json
{
  "deviceId": "...",
  "command": "turnOn"
}
```

### v2 `switchbot_set_power`

```json
{
  "deviceId": "...",
  "power": "on"
}
```

### v2 `switchbot_send_command`

```json
{
  "deviceId": "...",
  "command": "setBrightness",
  "parameter": "50",
  "commandType": "command"
}
```

## Transport updates

- `stdio` remains the default transport.
- HTTP transport must set:
  - `MCP_TRANSPORT=http`
  - `MCP_SERVER_API_KEY=...`

## Operational updates

- Node.js baseline is `22+`.
- Dependency vulnerabilities fixed (`npm audit` high/critical clean).
- CI now enforces `typecheck`, `lint`, `format`, `test`, `build`, and `audit`.
