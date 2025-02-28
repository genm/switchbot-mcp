# @genm/switchbot-mcp

A Model Context Protocol server that provides SwitchBot device control capabilities to AI assistants.
[![smithery badge](https://smithery.ai/badge/@genm/switchbot-mcp)](https://smithery.ai/server/@genm/switchbot-mcp)

[日本語](./README.ja.md)

<a href="https://glama.ai/mcp/servers/k8m7mttrur"><img width="380" height="200" src="https://glama.ai/mcp/servers/k8m7mttrur/badge" alt="SwitchBot Server MCP server" /></a>

## Features

- List devices
- Get device status
- Control devices (on/off)
- Change device settings
- Scene control
- Device status monitoring

## Installation

### Installing via Smithery

To install SwitchBot MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@genm/switchbot-mcp):

```bash
npx -y @smithery/cli install @genm/switchbot-mcp --client claude
```

### Manual Installation
```bash
npm install @genm/switchbot-mcp
```

## Setup

### 1. SwitchBot API Configuration

1. Install the SwitchBot app
2. Create an account and sign in
3. Go to Profile > Settings > Developer Options
4. Get both the token and secret key

### 2. MCP Server Configuration

Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "switchbot": {
      "command": "node",
      "args": ["path/to/switchbot-mcp/build/index.js"],
      "env": {
        "SWITCHBOT_TOKEN": "your_token",
        "SWITCHBOT_SECRET": "your_secret"
      }
    }
  }
}
```

### 3. Environment Variables

```env
SWITCHBOT_TOKEN=your_token
SWITCHBOT_SECRET=your_secret
```

## Supported Devices

- Plug
  - Living Room Floor Lamp
  - Office PC Power Supply
- Bot
  - Kitchen Coffee Maker
  - Living Room Air Purifier
- Curtain
  - Bedroom Window Curtain
  - Study Room Blackout Curtain
- Air Conditioner
  - Living Room AC
  - Bedroom AC
- Humidifier
  - Bedroom Humidifier
  - Study Room Humidifier
- Light
  - Kitchen Ceiling Light
  - Bedroom Night Light
- Remote Control
  - Living Room TV
  - Study Room Fan

## Device Name Examples

It's recommended to give descriptive names to your devices for easier control by AI assistants. Examples:

- "Bedroom Curtain" instead of just "Curtain"
- "Living Room AC" instead of just "Air Conditioner"
- "Kitchen Coffee Maker" instead of just "Bot"

This naming convention helps AI assistants understand the context and location of each device.

## Supported Operations

### Device Management
- List devices
- Get device status
- Turn devices on/off
- Change device settings

### Scene Management
- List scenes
- Execute scenes

### Sensor Information
- Temperature
- Humidity
- Brightness
- Motion

## Development

```bash
# Build
npm run build

# Development mode (TypeScript)
npm run dev

# Start
npm start
```

## Troubleshooting

### Device Not Responding

1. Verify the device is within Bluetooth range
2. Check device battery status
3. Verify SwitchBot hub connection status

### Authentication Errors

1. Check token and secret key expiration
2. Regenerate token and secret key
3. Update environment variables

## License

ISC
