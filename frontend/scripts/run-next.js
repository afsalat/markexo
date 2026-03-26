#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const appConfig = require('../src/config/appConfig.json');

const command = process.argv[2];

if (!['dev', 'start'].includes(command)) {
    console.error(`Unsupported Next.js command: ${command}`);
    process.exit(1);
}

const nextBin = require.resolve('next/dist/bin/next');
const port = String(appConfig.frontendPort);

const child = spawn(process.execPath, [nextBin, command, '-p', port], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
});

child.on('exit', (code) => {
    process.exit(code ?? 0);
});
