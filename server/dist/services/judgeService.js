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
    constructor() {
        this.apiUrl = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');
        this.apiKey = process.env.JUDGE0_API_KEY || '';
        this.apiHost = process.env.JUDGE0_API_HOST || '';
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
     * Execute code with given stdin using Judge0 (primary) or local runner (fallback)
     */
    async execute(language, sourceCode, stdin = '', timeLimit = 2.0, memoryLimit = 256) {
        try {
            return await this.executeViaJudge0(language, sourceCode, stdin, timeLimit, memoryLimit);
        }
        catch (err) {
            console.warn(`[Judge0 Warning] Execution via Judge0 failed (${err.message}). Falling back to local runner...`);
            return await this.executeViaLocal(language, sourceCode, stdin, timeLimit);
        }
    }
    /**
     * Judge0 execution method
     */
    async executeViaJudge0(language, sourceCode, stdin, timeLimit, memoryLimit) {
        const languageId = JUDGE0_LANGUAGE_IDS[language];
        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['X-RapidAPI-Key'] = this.apiKey;
        }
        if (this.apiHost) {
            headers['X-RapidAPI-Host'] = this.apiHost;
        }
        const payload = {
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin || '',
            cpu_time_limit: Math.max(1, Math.min(timeLimit, 10)),
            memory_limit: memoryLimit * 1024, // in KB
            wait: true,
        };
        const response = await axios_1.default.post(`${this.apiUrl}/submissions?wait=true`, payload, {
            headers,
            timeout: 15000,
        });
        const data = response.data;
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
    /**
     * Local sandboxed process runner (Fallback)
     */
    async executeViaLocal(language, sourceCode, stdin, timeLimit) {
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'code-arena-'));
        const startTime = Date.now();
        try {
            if (language === 'python') {
                const filePath = path_1.default.join(tempDir, 'solution.py');
                fs_1.default.writeFileSync(filePath, sourceCode);
                const execResult = await this.runProcess('python', [filePath], stdin, tempDir, timeLimit);
                const executionTime = (Date.now() - startTime) / 1000;
                if (execResult.timedOut) {
                    return {
                        stdout: null,
                        stderr: 'Time Limit Exceeded',
                        compile_output: null,
                        status: { id: 5, description: 'Time Limit Exceeded' },
                        time: timeLimit,
                        memory: null,
                    };
                }
                if (execResult.exitCode !== 0) {
                    return {
                        stdout: execResult.stdout,
                        stderr: execResult.stderr,
                        compile_output: null,
                        status: { id: 11, description: 'Runtime Error' },
                        time: executionTime,
                        memory: null,
                    };
                }
                return {
                    stdout: execResult.stdout,
                    stderr: execResult.stderr,
                    compile_output: null,
                    status: { id: 3, description: 'Accepted' },
                    time: executionTime,
                    memory: null,
                };
            }
            else if (language === 'c') {
                const srcPath = path_1.default.join(tempDir, 'solution.c');
                const binPath = path_1.default.join(tempDir, os_1.default.platform() === 'win32' ? 'solution.exe' : 'solution');
                fs_1.default.writeFileSync(srcPath, sourceCode);
                // Compile
                const compileRes = await this.runProcess('gcc', [srcPath, '-O2', '-o', binPath], '', tempDir, 8);
                if (compileRes.exitCode !== 0) {
                    return {
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    };
                }
                // Execute
                const execResult = await this.runProcess(binPath, [], stdin, tempDir, timeLimit);
                const executionTime = (Date.now() - startTime) / 1000;
                if (execResult.timedOut) {
                    return {
                        stdout: null,
                        stderr: 'Time Limit Exceeded',
                        compile_output: null,
                        status: { id: 5, description: 'Time Limit Exceeded' },
                        time: timeLimit,
                        memory: null,
                    };
                }
                if (execResult.exitCode !== 0) {
                    return {
                        stdout: execResult.stdout,
                        stderr: execResult.stderr,
                        compile_output: null,
                        status: { id: 11, description: 'Runtime Error' },
                        time: executionTime,
                        memory: null,
                    };
                }
                return {
                    stdout: execResult.stdout,
                    stderr: execResult.stderr,
                    compile_output: null,
                    status: { id: 3, description: 'Accepted' },
                    time: executionTime,
                    memory: null,
                };
            }
            else if (language === 'cpp') {
                const srcPath = path_1.default.join(tempDir, 'solution.cpp');
                const binPath = path_1.default.join(tempDir, os_1.default.platform() === 'win32' ? 'solution.exe' : 'solution');
                fs_1.default.writeFileSync(srcPath, sourceCode);
                // Compile
                const compileRes = await this.runProcess('g++', [srcPath, '-O2', '-o', binPath], '', tempDir, 8);
                if (compileRes.exitCode !== 0) {
                    return {
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    };
                }
                // Execute
                const execResult = await this.runProcess(binPath, [], stdin, tempDir, timeLimit);
                const executionTime = (Date.now() - startTime) / 1000;
                if (execResult.timedOut) {
                    return {
                        stdout: null,
                        stderr: 'Time Limit Exceeded',
                        compile_output: null,
                        status: { id: 5, description: 'Time Limit Exceeded' },
                        time: timeLimit,
                        memory: null,
                    };
                }
                if (execResult.exitCode !== 0) {
                    return {
                        stdout: execResult.stdout,
                        stderr: execResult.stderr,
                        compile_output: null,
                        status: { id: 11, description: 'Runtime Error' },
                        time: executionTime,
                        memory: null,
                    };
                }
                return {
                    stdout: execResult.stdout,
                    stderr: execResult.stderr,
                    compile_output: null,
                    status: { id: 3, description: 'Accepted' },
                    time: executionTime,
                    memory: null,
                };
            }
            else if (language === 'java') {
                // Detect class name or use Main
                const classMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                const className = classMatch ? classMatch[1] : 'Main';
                const srcPath = path_1.default.join(tempDir, `${className}.java`);
                fs_1.default.writeFileSync(srcPath, sourceCode);
                // Compile
                const compileRes = await this.runProcess('javac', [srcPath], '', tempDir, 10);
                if (compileRes.exitCode !== 0) {
                    return {
                        stdout: null,
                        stderr: null,
                        compile_output: compileRes.stderr || compileRes.stdout,
                        status: { id: 6, description: 'Compilation Error' },
                        time: null,
                        memory: null,
                    };
                }
                // Execute
                const execResult = await this.runProcess('java', ['-cp', tempDir, className], stdin, tempDir, timeLimit);
                const executionTime = (Date.now() - startTime) / 1000;
                if (execResult.timedOut) {
                    return {
                        stdout: null,
                        stderr: 'Time Limit Exceeded',
                        compile_output: null,
                        status: { id: 5, description: 'Time Limit Exceeded' },
                        time: timeLimit,
                        memory: null,
                    };
                }
                if (execResult.exitCode !== 0) {
                    return {
                        stdout: execResult.stdout,
                        stderr: execResult.stderr,
                        compile_output: null,
                        status: { id: 11, description: 'Runtime Error' },
                        time: executionTime,
                        memory: null,
                    };
                }
                return {
                    stdout: execResult.stdout,
                    stderr: execResult.stderr,
                    compile_output: null,
                    status: { id: 3, description: 'Accepted' },
                    time: executionTime,
                    memory: null,
                };
            }
            throw new Error(`Unsupported language for local runner: ${language}`);
        }
        finally {
            try {
                fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            }
            catch (cleanErr) {
                // ignore cleanup error
            }
        }
    }
    /**
     * Helper to spawn a process with timeout, stdin, and buffer limits
     */
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
                catch (e) {
                    // ignore
                }
            }, timeoutSeconds * 1000);
            if (stdin) {
                proc.stdin.write(stdin);
            }
            proc.stdin.end();
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > 512 * 1024) {
                    proc.kill();
                }
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                if (stderr.length > 512 * 1024) {
                    proc.kill();
                }
            });
            proc.on('close', (code) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr,
                    exitCode: code,
                    timedOut,
                });
            });
            proc.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    stdout: '',
                    stderr: err.message,
                    exitCode: 1,
                    timedOut: false,
                });
            });
        });
    }
}
exports.JudgeService = JudgeService;
exports.judgeService = new JudgeService();
