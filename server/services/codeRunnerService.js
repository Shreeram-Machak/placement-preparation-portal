const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const util = require('util');

const execFileAsync = util.promisify(execFile);
const EXECUTION_TIMEOUT = 3000;
const RUN_DIRECTORY = path.join(__dirname, '..', '.code-runs');

const wrappers = {
  javascript: (code, input) => ({
    command: process.execPath,
    extension: 'js',
    source: `${code}\nPromise.resolve(solve(${JSON.stringify(input)})).then((value) => process.stdout.write(String(value)));`,
  }),
  python: (code, input) => ({
    command: 'py',
    args: ['-3'],
    extension: 'py',
    source: `${code}\nprint(solve(${JSON.stringify(input)}))`,
  }),
  java: (code, input) => ({
    command: 'java',
    extension: 'java',
    fileName: 'Main.java',
    source: `${code}\nclass Main { public static void main(String[] args) throws Exception { System.out.print(Solution.solve(${JSON.stringify(input)})); } }`,
  }),
};

const runProcess = async (command, args, cwd) => {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout: EXECUTION_TIMEOUT,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return { output: stdout.trim(), error: stderr.trim() };
  } catch (error) {
    if (error.killed || error.signal) return { error: 'Execution timed out after 3 seconds.' };
    return { error: (error.stderr || error.message).trim() };
  }
};

const runSingleCase = async ({ language, code, input }) => {
  if (language === 'cpp') {
    return { error: 'C++ execution requires g++ to be installed on the server.' };
  }

  const build = wrappers[language];
  if (!build) return { error: 'Unsupported coding language.' };

  await fs.mkdir(RUN_DIRECTORY, { recursive: true });
  const tempDirectory = await fs.mkdtemp(path.join(RUN_DIRECTORY, 'run-'));
  try {
    const config = build(code, input);
    const fileName = config.fileName || `solution.${config.extension}`;
    const sourcePath = path.join(tempDirectory, fileName);
    await fs.writeFile(sourcePath, config.source, 'utf8');

    if (language === 'java') {
      return runProcess('java', [sourcePath], tempDirectory);
    }

    const execution = await runProcess(
      config.command,
      [...(config.args || []), sourcePath],
      tempDirectory,
    );
    if (language === 'python' && /access is denied|unable to create process/i.test(execution.error || '')) {
      return { error: 'Python execution requires a standard Python installation available to the server.' };
    }
    return execution;
  } finally {
    try {
      await fs.rm(tempDirectory, {
        recursive: true,
        force: true,
        maxRetries: 4,
        retryDelay: 100,
      });
    } catch {
      // Windows can hold compiler files briefly after a timed process exits.
    }
  }
};

const runCode = async ({ language, code, testCases }) => {
  const startedAt = process.hrtime.bigint();
  const results = [];
  for (const testCase of testCases) {
    const execution = await runSingleCase({ language, code, input: testCase.input });
    const actual = execution.error || execution.output;
    results.push({
      input: testCase.input,
      expected: testCase.output,
      actual,
      passed: !execution.error && actual.trim() === String(testCase.output).trim(),
      error: execution.error || '',
    });
  }
  return {
    results,
    runtimeMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
  };
};

const runCustomInput = async ({ language, code, input }) => {
  const startedAt = process.hrtime.bigint();
  const execution = await runSingleCase({ language, code, input });
  return {
    output: execution.error || execution.output,
    error: execution.error || '',
    runtimeMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
  };
};

module.exports = { runCode, runCustomInput };
