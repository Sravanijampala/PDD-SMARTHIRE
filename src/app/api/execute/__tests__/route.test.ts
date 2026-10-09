import { POST } from '../route';
import { NextRequest } from 'next/server';

function mockRequest(body, ip = '127.0.0.1') {
  return {
    json: async () => body,
    headers: new Headers({ 'x-forwarded-for': ip }),
  };
}

describe('/api/execute', () => {
  it('should run valid python code', async () => {
    const req = mockRequest({
      language: 'python',
      code: 'import sys\nprint("Hello " + sys.stdin.read().strip())',
      stdin: 'World'
    }, '127.0.0.1');
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.run.stdout.trim()).toBe('Hello World');
    expect(data.run.code).toBe(0);
    expect(data.run.time).toBeGreaterThanOrEqual(0);
  });

  it('should handle syntax error in python', async () => {
    // Different IP to bypass rate limit
    const req = mockRequest({
      language: 'python',
      code: 'print("Hello" + )',
      stdin: ''
    }, '127.0.0.2');
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.run.code).not.toBe(0);
    expect(data.run.stderr).toContain('SyntaxError');
  });

  it('should run valid javascript code', async () => {
    const req = mockRequest({
      language: 'js',
      code: 'const fs = require("fs");\nconsole.log("JS " + fs.readFileSync(0, "utf-8").trim());',
      stdin: 'Test'
    }, '127.0.0.3');
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.run.stdout.trim()).toBe('JS Test');
    expect(data.run.code).toBe(0);
  });
});
