"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeService = exports.JudgeService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
// Map supported language to Judge0 language IDs
const JUDGE0_LANGUAGE_IDS = {
    c: 50, // C (GCC 9.2.0)
    cpp: 54, // C++ (GCC 9.2.0)
    java: 91, // Java (JDK 17.0.6)
    python: 71, // Python (3.8.1)
};
class JudgeService {
    apiUrl;
    apiKey;
    apiHost;
    enginePreference;
    // Circuit breaker for Judge0 public endpoint
    judge0FailureCount = 0;
    judge0CircuitOpenUntil = 0;
    // Cache for local compiler availability
    localCompilers = {
        python: false,
        c: false,
        cpp: false,
        java: false,
    };
    constructor() {
        this.apiUrl = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');
        this.apiKey = process.env.JUDGE0_API_KEY || '';
        this.apiHost = process.env.JUDGE0_API_HOST || '';
        // If an explicit engine is set in .env, use it; otherwise 'auto'
        const envEngine = (process.env.EXECUTION_ENGINE || '').toLowerCase();
        if (envEngine === 'local' || envEngine === 'judge0') {
            this.enginePreference = envEngine;
        }
        else {
            // Default to 'local' if no Judge0 API key is set, because local is instantaneous
            this.enginePreference = this.apiKey ? 'judge0' : 'local';
        }
        this.detectLocalCompilers();
    }
    /**
     * Detect which compilers are available on the local machine/container
     */
    detectLocalCompilers() {
        try {
            (0, child_process_1.execSync)('python --version', { stdio: 'ignore' });
            this.localCompilers.python = true;
        }
        catch {
            try {
                (0, child_process_1.execSync)('python3 --version', { stdio: 'ignore' });
                this.localCompilers.python = true;
            }
            catch {
                this.localCompilers.python = false;
            }
        }
        try {
            (0, child_process_1.execSync)('gcc --version', { stdio: 'ignore' });
            this.localCompilers.c = true;
        }
        catch {
            this.localCompilers.c = false;
        }
        try {
            (0, child_process_1.execSync)('g++ --version', { stdio: 'ignore' });
            this.localCompilers.cpp = true;
        }
        catch {
            this.localCompilers.cpp = false;
        }
        try {
            (0, child_process_1.execSync)('javac -version', { stdio: 'ignore' });
            this.localCompilers.java = true;
        }
        catch {
            this.localCompilers.java = false;
        }
        console.log('[JudgeService] Detected local toolchains:', this.localCompilers, `(Default Mode: ${this.enginePreference})`);
    }
    /**
     * Normalize output for comparison:
     * Replaces Windows \r\n with \n, trims trailing whitespace on each line,
     * and trims leading/trailing whitespace of the entire text.
     */
    normalizeOutput(text) {
        if (!text)
            return '';
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((line) => line.trimEnd())
            .join('\n')
            .trim();
    }
    /**
     * Execute single test case
     */
    async execute(language, sourceCode, stdin = '', timeLimit = 2.0, memoryLimit = 256) {
        const results = await this.executeBatch(language, sourceCode, [{ input: stdin }], timeLimit, memoryLimit);
        return results[0];
    }
    /**
     * Execute code against MULTIPLE test cases in batch.
     * Prioritizes local execution when available for sub-second speeds.
     */
    async executeBatch(language, sourceCode, testCases, timeLimit = 2.0, memoryLimit = 256) {
        if (testCases.length === 0)
            return [];
        const isLocalCapable = this.localCompilers[language];
        const isCircuitOpen = Date.now() < this.judge0CircuitOpenUntil;
        // Prefer local execution if:
        // 1) enginePreference is 'local' and local compiler exists
        // 2) or Judge0 circuit is open (failing/timed out)
        // 3) or enginePreference is 'auto' without a paid Judge0 key and compiler exists
        if (isLocalCapable && (this.enginePreference === 'local' || isCircuitOpen || !this.apiKey)) {
            try {
                return await this.executeBatchViaLocal(language, sourceCode, testCases, timeLimit);
            }
            catch (localErr) {
                console.warn(`[Local Judge Warning] Local execution failed (${localErr.message}). Attempting Judge0 fallback...`);
            }
        }
        // Try Judge0
        if (!isCircuitOpen) {
            try {
                const results = await this.executeBatchViaJudge0(language, sourceCode, testCases, timeLimit, memoryLimit);
                this.judge0FailureCount = 0; // Reset circuit breaker on success
                return results;
            }
            catch (judge0Err) {
                this.judge0FailureCount++;
                console.warn(`[Judge0 Warning] Request failed: ${judge0Err.message}. (Failure count: ${this.judge0FailureCount})`);
                if (this.judge0FailureCount >= 2) {
                    // Open circuit breaker for 60 seconds
                    this.judge0CircuitOpenUntil = Date.now() + 60 * 1000;
                    console.warn(`[Judge0 Circuit Breaker] Tripped. Routing all traffic to local runner for 60s.`);
                }
            }
        }
        // Fall back to local if not already attempted
        return await this.executeBatchViaLocal(language, sourceCode, testCases, timeLimit);
    }
    // ──────────────────────────────────────────────
    //  Judge0 — Batch API
    // ──────────────────────────────────────────────
    async executeBatchViaJudge0(language, sourceCode, testCases, timeLimit, memoryLimit) {
        const languageId = JUDGE0_LANGUAGE_IDS[language];
        if (!languageId)
            throw new Error(`Unsupported language: ${language}`);
        const headers = this.getJudge0Headers();
        const submissions = testCases.map((tc) => ({
            source_code: sourceCode,
            language_id: languageId,
            stdin: tc.input || '',
            cpu_time_limit: Math.max(1, Math.min(timeLimit, 5)),
            memory_limit: memoryLimit * 1024,
        }));
        // Submit batch with 6s timeout so it doesn't freeze the user if Judge0 is unresponsive
        const batchResponse = await axios_1.default.post(`${this.apiUrl}/submissions/batch`, { submissions }, { headers, timeout: 6000 });
        const tokens = (batchResponse.data || []).map((item) => item.token);
        if (tokens.length === 0) {
            throw new Error('Judge0 batch returned no tokens.');
        }
        return await this.pollBatchResults(tokens, headers);
    }
    async pollBatchResults(tokens, headers) {
        const tokenStr = tokens.join(',');
        const maxAttempts = 15;
        let delay = 350;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this.sleep(delay);
            try {
                const resp = await axios_1.default.get(`${this.apiUrl}/submissions/batch`, {
                    params: { tokens: tokenStr, fields: 'token,stdout,stderr,compile_output,status,time,memory,message' },
                    headers,
                    timeout: 5000,
                });
                const subs = resp.data?.submissions || resp.data || [];
                const allDone = subs.every((s) => s.status && s.status.id >= 3);
                if (allDone) {
                    const tokenMap = new Map();
                    for (const s of subs) {
                        tokenMap.set(s.token, s);
                    }
                    return tokens.map((t) => this.mapJudge0Response(tokenMap.get(t) || {}));
                }
            }
            catch (pollErr) {
                console.warn(`[Judge0 Poll] Attempt ${attempt + 1} warning: ${pollErr.message}`);
            }
            delay = Math.min(delay + 150, 1500);
        }
        throw new Error('Judge0 batch polling timed out.');
    }
    // ──────────────────────────────────────────────
    //  Local Runner — Compile Once, Run Many
    // ──────────────────────────────────────────────
    async executeBatchViaLocal(language, sourceCode, testCases, timeLimit) {
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'code-arena-'));
        try {
            let runCmd;
            let runArgs;
            // 1. Prepare & Compile
            if (language === 'python') {
                const filePath = path_1.default.join(tempDir, 'solution.py');
                fs_1.default.writeFileSync(filePath, sourceCode);
                runCmd = this.localCompilers.python ? (process.platform === 'win32' ? 'python' : 'python3') : 'python';
                runArgs = [filePath];
            }
            else if (language === 'c') {
                const srcPath = path_1.default.join(tempDir, 'solution.c');
                const binPath = path_1.default.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
                fs_1.default.writeFileSync(srcPath, sourceCode);
                // Fast compilation with -O2
                const compileRes = await this.runProcess('gcc', [srcPath, '-O2', '-o', binPath, '-lm'], '', tempDir, 6);
                if (compileRes.exitCode !== 0) {
                    return testCases.map(() => ({
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    }));
                }
                runCmd = binPath;
                runArgs = [];
            }
            else if (language === 'cpp') {
                const srcPath = path_1.default.join(tempDir, 'solution.cpp');
                const binPath = path_1.default.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
                fs_1.default.writeFileSync(srcPath, sourceCode);
                const compileRes = await this.runProcess('g++', [srcPath, '-O2', '-o', binPath], '', tempDir, 6);
                if (compileRes.exitCode !== 0) {
                    return testCases.map(() => ({
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    }));
                }
                runCmd = binPath;
                runArgs = [];
            }
            else if (language === 'java') {
                const classMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                const className = classMatch ? classMatch[1] : 'Main';
                const srcPath = path_1.default.join(tempDir, `${className}.java`);
                fs_1.default.writeFileSync(srcPath, sourceCode);
                const compileRes = await this.runProcess('javac', [srcPath], '', tempDir, 8);
                if (compileRes.exitCode !== 0) {
                    return testCases.map(() => ({
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    }));
                }
                runCmd = 'java';
                runArgs = ['-cp', tempDir, className];
            }
            else {
                throw new Error(`Unsupported language: ${language}`);
            }
            // 2. Execute all test cases concurrently against the compiled binary
            const CONCURRENCY = 4;
            const results = new Array(testCases.length);
            for (let batch = 0; batch < testCases.length; batch += CONCURRENCY) {
                const chunk = testCases.slice(batch, batch + CONCURRENCY);
                const promises = chunk.map(async (tc, idx) => {
                    const globalIdx = batch + idx;
                    const startTime = Date.now();
                    const execResult = await this.runProcess(runCmd, runArgs, tc.input, tempDir, timeLimit);
                    const executionTime = (Date.now() - startTime) / 1000;
                    if (execResult.timedOut) {
                        results[globalIdx] = {
                            stdout: null,
                            stderr: 'Time Limit Exceeded',
                            compile_output: null,
                            status: { id: 5, description: 'Time Limit Exceeded' },
                            time: timeLimit,
                            memory: null,
                        };
                    }
                    else if (execResult.exitCode !== 0) {
                        results[globalIdx] = {
                            stdout: execResult.stdout,
                            stderr: execResult.stderr,
                            compile_output: null,
                            status: { id: 11, description: 'Runtime Error' },
                            time: executionTime,
                            memory: null,
                        };
                    }
                    else {
                        results[globalIdx] = {
                            stdout: execResult.stdout,
                            stderr: execResult.stderr,
                            compile_output: null,
                            status: { id: 3, description: 'Accepted' },
                            time: executionTime,
                            memory: null,
                        };
                    }
                });
                await Promise.all(promises);
            }
            return results;
        }
        finally {
            try {
                fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            }
            catch {
                // ignore cleanup error
            }
        }
    }
    // ──────────────────────────────────────────────
    //  Shared Helpers
    // ──────────────────────────────────────────────
    getJudge0Headers() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey)
            headers['X-RapidAPI-Key'] = this.apiKey;
        if (this.apiHost)
            headers['X-RapidAPI-Host'] = this.apiHost;
        return headers;
    }
    mapJudge0Response(data) {
        return {
            stdout: data.stdout || null,
            stderr: data.stderr || null,
            compile_output: data.compile_output || null,
            status: data.status || { id: 3, description: 'Accepted' },
            time: data.time || null,
            memory: data.memory || null,
            message: data.message || null,
        };
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    runProcess(cmd, args, stdin, cwd, timeoutSeconds) {
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            const proc = (0, child_process_1.spawn)(cmd, args, {
                cwd,
                env: { ...process.env, PATH: process.env.PATH },
            });
            const timer = setTimeout(() => {
                timedOut = true;
                try {
                    proc.kill('SIGKILL');
                }
                catch {
                    // ignore
                }
            }, timeoutSeconds * 1000);
            if (stdin) {
                proc.stdin.write(stdin);
            }
            proc.stdin.end();
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > 512 * 1024)
                    proc.kill();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                if (stderr.length > 512 * 1024)
                    proc.kill();
            });
            proc.on('close', (code) => {
                clearTimeout(timer);
                resolve({ stdout, stderr, exitCode: code, timedOut });
            });
            proc.on('error', (err) => {
                clearTimeout(timer);
                resolve({ stdout: '', stderr: err.message, exitCode: 1, timedOut: false });
            });
        });
    }
}
exports.JudgeService = JudgeService;
exports.judgeService = new JudgeService();
