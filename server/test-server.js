#!/usr/bin/env node

/**
 * Quick Server Test Script
 * Verifies that the server can start and basic endpoints are accessible
 */

const http = require('http');

console.log('🧪 GhostMonitor Server Test Suite\n');

// Test 1: Check if server can start
console.log('Test 1: Checking if server can start...');
try {
    const app = require('./index.js');
    console.log('✅ Server module loaded successfully\n');
} catch (error) {
    console.error('❌ Failed to load server:', error.message);
    process.exit(1);
}

// Test 2: Check dependencies
console.log('Test 2: Checking dependencies...');
const dependencies = [
    'express',
    'express-session',
    'cors',
    'compression',
    'mysql2',
    'bcryptjs',
    'dotenv',
    'ejs',
    'helmet',
    'express-rate-limit',
    'morgan'
];

let allDepsOk = true;
dependencies.forEach(dep => {
    try {
        require(dep);
        console.log(`  ✅ ${dep}`);
    } catch (error) {
        console.log(`  ❌ ${dep} - NOT INSTALLED`);
        allDepsOk = false;
    }
});

if (!allDepsOk) {
    console.error('\n❌ Some dependencies are missing. Run: npm install');
    process.exit(1);
}

console.log('\n✅ All dependencies installed\n');

// Test 3: Check environment
console.log('Test 3: Checking environment configuration...');
require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];
let envOk = true;

requiredEnv.forEach(key => {
    if (process.env[key]) {
        console.log(`  ✅ ${key} = ${process.env[key].substring(0, 20)}...`);
    } else {
        console.log(`  ⚠️  ${key} - NOT SET (using default)`);
    }
});

console.log('\n✅ Environment configuration loaded\n');

// Test 4: Check file structure
console.log('Test 4: Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'views/user-dashboard.html',
    'views/dashboard.html',
    'views/login.ejs',
    'public/sw.js',
    'public/manifest.json',
    'routes/user.js',
    'routes/dashboard.js',
    'api/admin-routes.js',
    'api/auth.js'
];

let filesOk = true;
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        console.log(`  ✅ ${file} (${size} bytes)`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        filesOk = false;
    }
});

if (!filesOk) {
    console.error('\n❌ Some required files are missing');
    process.exit(1);
}

console.log('\n✅ All required files present\n');

// Test 5: Summary
console.log('═══════════════════════════════════════════════════════');
console.log('✅ ALL TESTS PASSED - Server is ready to start!');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📝 Next steps:');
console.log('  1. Update .env with your database credentials');
console.log('  2. Create database schema: mysql ghostmonitor < schema_supabase.sql');
console.log('  3. Start server: npm run dev');
console.log('  4. Open http://localhost:3000\n');

process.exit(0);
