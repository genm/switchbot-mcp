#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import crypto from 'crypto';

const SWITCHBOT_TOKEN = process.env.SWITCHBOT_TOKEN;
const SWITCHBOT_SECRET = process.env.SWITCHBOT_SECRET;

if (!SWITCHBOT_TOKEN || !SWITCHBOT_SECRET) {
    throw new Error('SWITCHBOT_TOKEN and SWITCHBOT_SECRET environment variables are required');
}

interface SwitchBotDevice {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    enableCloudService: boolean;
    hubDeviceId: string;
}

interface SwitchBotStatus {
    deviceId: string;
    deviceType: string;
    power: 'on' | 'off';
    temperature?: number;
    humidity?: number;
}

class SwitchBotServer {
    private server: Server;
    private axiosInstance;

    constructor() {
        this.server = new Server(
            {
                name: 'switchbot-server',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // SwitchBot APIのタイムスタンプとノンスを生成する関数
        const generateAuthHeaders = () => {
            const t = Date.now();
            const nonce = 'requestID';
            const data = SWITCHBOT_TOKEN! + t + nonce;
            const signTerm = crypto.createHmac('sha256', SWITCHBOT_SECRET!)
                .update(Buffer.from(data, 'utf-8'))
                .digest('base64');

            return {
                Authorization: SWITCHBOT_TOKEN,
                sign: signTerm,
                nonce: nonce,
                t: t.toString(),
            };
        };

        this.axiosInstance = axios.create({
            baseURL: 'https://api.switch-bot.com/v1.1',
            headers: generateAuthHeaders(),
        });

        this.setupToolHandlers();

        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'list_devices',
                    description: 'デバイス一覧を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                        required: [],
                    },
                },
                {
                    name: 'get_device_status',
                    description: 'デバイスのステータスを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'デバイスID',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'control_device',
                    description: 'デバイスを制御します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'デバイスID',
                            },
                            command: {
                                type: 'string',
                                description: 'コマンド（turnOn, turnOff）',
                                enum: ['turnOn', 'turnOff'],
                            },
                        },
                        required: ['deviceId', 'command'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case 'list_devices': {
                        const response = await this.axiosInstance.get('/devices');
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data.body.deviceList, null, 2),
                                },
                            ],
                        };
                    }

                    case 'get_device_status': {
                        const args = request.params.arguments;
                        if (!args || typeof args.deviceId !== 'string') {
                            throw new McpError(
                                ErrorCode.InvalidParams,
                                'デバイスIDが必要です'
                            );
                        }

                        const response = await this.axiosInstance.get(
                            `/devices/${args.deviceId}/status`
                        );

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data.body, null, 2),
                                },
                            ],
                        };
                    }

                    case 'control_device': {
                        const args = request.params.arguments;
                        if (!args || typeof args.deviceId !== 'string' || typeof args.command !== 'string') {
                            throw new McpError(
                                ErrorCode.InvalidParams,
                                'デバイスIDとコマンドが必要です'
                            );
                        }

                        const response = await this.axiosInstance.post(
                            `/devices/${args.deviceId}/commands`,
                            {
                                command: args.command,
                                parameter: 'default',
                                commandType: 'command',
                            }
                        );

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data, null, 2),
                                },
                            ],
                        };
                    }

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `SwitchBot API error: ${error.response?.data?.message ?? error.message
                                    }`,
                            },
                        ],
                        isError: true,
                    };
                }
                throw error;
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SwitchBot MCP server running on stdio');
    }
}

const server = new SwitchBotServer();
server.run().catch(console.error);
