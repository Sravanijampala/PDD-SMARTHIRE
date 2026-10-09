import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Local code execution API route — acts as a real compiler/interpreter.
 *
 * Supported runtimes (all run locally on the machine):
 *   - Python  (python)
 *   - JavaScript (node)
 *   - Java    (javac + java)
 *   - C++     (g++ — requires MinGW/MSYS2)
 *   - C       (gcc — requires MinGW/MSYS2)
 *
 * Each submission is sandboxed in its own temp directory that is cleaned up
 * after execution.  Stdin is piped via a temp file for reliability on Windows.
 */

// Per-IP rate limit (in-memory; use Redis in production)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2000;
const EXEC_TIMEOUT  = 15_000;   // 15 seconds

// File names per language
const FILE_CONFIG: Record<string, { file: string; compile?: string; run: string }> = {
  python: {
    file: 'solution.py',
    run:  'python "{file}"',
  },
  js: {
    file: 'solution.js',
    run:  'node "{file}"',
  },
  java: {
    file: 'Solution.java',
    compile: 'javac "{file}"',
    run:     'java -cp "{dir}" Solution',
  },
  cpp: {
    file: 'solution.cpp',
    compile: 'g++ -o "{dir}\\\\solution.exe" "{file}" -std=c++17',
    run:     '"{dir}\\\\solution.exe"',
  },
  c: {
    file: 'solution.c',
    compile: 'gcc -o "{dir}\\\\solution.exe" "{file}"',
    run:     '"{dir}\\\\solution.exe"',
  },
};

const ALLOWED = new Set(Object.keys(FILE_CONFIG));

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit ───────────────────────────────────────────────────────
    const ip  = req.headers.get('x-forwarded-for') || 'local';
    const now = Date.now();
    if (now - (rateLimitMap.get(ip) || 0) < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'Rate limit: please wait a moment between runs.' },
        { status: 429 },
      );
    }
    rateLimitMap.set(ip, now);

    // ── Parse request ────────────────────────────────────────────────────
    const { language, code, stdin } = await req.json();

    if (!language || !ALLOWED.has(language)) {
      return NextResponse.json({ error: 'Unsupported language: ' + language }, { status: 400 });
    }
    if (!code || typeof code !== 'string' || code.length > 50_000) {
      return NextResponse.json({ error: 'Invalid or too-large code.' }, { status: 400 });
    }

    const cfg      = FILE_CONFIG[language];
    const tempDir  = await fs.mkdtemp(path.join(os.tmpdir(), 'smarthire-run-'));
    const filePath = path.join(tempDir, cfg.file);
    const stdinF   = path.join(tempDir, 'stdin.txt');

    await fs.writeFile(filePath, code, 'utf-8');
    await fs.writeFile(stdinF,  stdin || '', 'utf-8');

    const fill = (tpl: string) =>
      tpl.replace(/\{file\}/g, filePath).replace(/\{dir\}/g, tempDir);

    // ── Compile (if needed) ──────────────────────────────────────────────
    let compileResult: { stdout: string; stderr: string } | null = null;
    if (cfg.compile) {
      try {
        compileResult = await execAsync(fill(cfg.compile), {
          timeout: EXEC_TIMEOUT,
          shell:   'cmd.exe',
          env:     { ...process.env, PYTHONUTF8: '1' },
        });
      } catch (compileErr: any) {
        fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        return NextResponse.json({
          run: {
            stdout: '',
            stderr: compileErr.stderr || compileErr.message || 'Compilation failed',
            output: compileErr.stderr || compileErr.message,
            code:   1,
            signal: null,
          },
          compile: {
            stdout: compileErr.stdout || '',
            stderr: compileErr.stderr || compileErr.message,
            code:   1,
          },
        });
      }
    }

    // ── Run ──────────────────────────────────────────────────────────────
    const runCmd = fill(cfg.run) + ' < "' + stdinF + '"';

    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execAsync(runCmd, {
        timeout:    EXEC_TIMEOUT,
        shell:      'cmd.exe',
        maxBuffer:  5 * 1024 * 1024, // 5 MB
        env:        { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      });
      const endTime = Date.now();
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      return NextResponse.json({
        run: {
          stdout: stdout || '',
          stderr: stderr || '',
          output: (stdout || '') + (stderr || ''),
          code:   0,
          signal: null,
          time:   (endTime - startTime) / 1000,
        },
      });
    } catch (runErr: any) {
      const endTime = Date.now();
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      // Distinguish timeout from runtime error
      const isTimeout = runErr.killed || runErr.signal === 'SIGTERM';
      return NextResponse.json({
        run: {
          stdout: runErr.stdout || '',
          stderr: isTimeout
            ? 'Time Limit Exceeded (15 s)'
            : (runErr.stderr || runErr.message || 'Runtime error'),
          output: runErr.stdout || runErr.stderr || runErr.message,
          code:   runErr.code ?? 1,
          signal: runErr.signal || null,
          time:   (endTime - startTime) / 1000,
        },
      });
    }
  } catch (err: any) {
    console.error('[/api/execute]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
