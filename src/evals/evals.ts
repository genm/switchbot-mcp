//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const list_devicesEval: EvalFunction = {
    name: 'list_devices Evaluation',
    description: 'Evaluates the device listing functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please list all available devices.");
        return JSON.parse(result);
    }
};

const get_device_statusEval: EvalFunction = {
    name: 'get_device_status Evaluation',
    description: 'Evaluates the functionality of the get_device_status tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "現在接続されているデバイスのステータスを教えてください。デバイスIDはabc123です。");
        return JSON.parse(result);
    }
};

const control_deviceEval: EvalFunction = {
    name: 'control_deviceEval',
    description: 'Evaluates the control_device tool functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please turn on the device with ID=abc123");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [list_devicesEval, get_device_statusEval, control_deviceEval]
};
  
export default config;
  
export const evals = [list_devicesEval, get_device_statusEval, control_deviceEval];