'use strict';

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

var app = child_process.fork(path.resolve(__dirname, '../app.js'), [], {
    silent: true
});

var users = child_process.fork(path.resolve(__dirname, './startUserServiceDev.js'), [], {
    silent: true
});

var auth = child_process.fork(path.resolve(__dirname, './startAuthServiceDev.js'), [], {
    silent: true
});

var emul = child_process.fork(path.resolve(__dirname, '../../sber-emulator/app/app.js'), [], {
    silent: true
});

var tests = child_process.spawn('npm', ['run', 'tests', '--timeout 0'], {
    cwd: path.resolve(__dirname, '../../integration-tests')
});

app.stdout.on('data', (data) => {
    fs.appendFile('appOut.log', data);
});

app.stderr.on('data', (data) => {
    fs.appendFile('appErr.log', data);
});

emul.stdout.on('data', (data) => {
    fs.appendFile('emulOut.log', data);
});

emul.stderr.on('data', (data) => {
    fs.appendFile('emulErr.log', data);
});

tests.stdout.on('data', (data) => {
    console.log(`${data}`);
});

tests.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

tests.on('close', (code) => {
    app.kill('SIGTERM');
    child_process.execSync('fuser 3001/tcp | xargs kill ');
    child_process.execSync('fuser 3002/tcp | xargs kill ');
    emul.kill('SIGTERM');
    console.log('tests passed with code ' + code);
    process.exit(code);
});
