#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// 启动编译后的应用
const electronPath = require('electron');
const appPath = path.join(__dirname);

const child = spawn(electronPath, [appPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  process.exit(code);
});
