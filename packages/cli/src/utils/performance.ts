import { performance } from 'perf_hooks';

// Store start time as soon as this module is imported
const cliStartTime = performance.now();
const timings: Record<string, number> = {};
let isEnabled = false;

/**
 * Enable or disable performance tracking
 */
export function enableProfiling(enabled: boolean): void {
  isEnabled = enabled;
}

/**
 * Mark a timing point in the application
 * Always collect data, but only report if profiling is enabled
 */
export function mark(label: string): void {
  // Always collect timing data regardless of whether profiling is enabled
  timings[label] = performance.now() - cliStartTime;
}

/**
 * Log all collected performance metrics
 */
export async function reportTimings(): Promise<void> {
  if (!isEnabled) return;

  console.log('\n📊 Performance Profile Results');
  console.log('=======================');
  console.log(
    `${'Label'.padEnd(40, ' ')}${'Time'.padStart(10, ' ')}${'Duration'.padStart(10, ' ')}`,
  );

  // Sort timings by time value
  const sortedTimings = Object.entries(timings).sort((a, b) => a[1] - b[1]);

  // Calculate durations between steps
  let previousTime = 0;
  for (const [label, time] of sortedTimings) {
    const duration = time - previousTime;
    console.log(
      `${label.padEnd(40, ' ')}${`${time.toFixed(2)}ms`.padStart(10, ' ')}${`${duration.toFixed(2)}ms`.padStart(10, ' ')}`,
    );
    previousTime = time;
  }

  console.log(`Total startup time: ${previousTime.toFixed(2)}ms`);
  console.log('=======================\n');

  // Report platform-specific information if on Windows
  if (process.platform === 'win32') {
    await reportPlatformInfo();
  }
}

/**
 * Collect and report platform-specific information
 */
async function reportPlatformInfo(): Promise<void> {
  if (!isEnabled) return;

  console.log('\n🖥️ Platform Information:');
  console.log('=======================');
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Node.js version: ${process.version}`);

  // Windows-specific information
  if (process.platform === 'win32') {
    console.log('Windows-specific details:');
    console.log(`- Current working directory: ${process.cwd()}`);
    console.log(`- Path length: ${process.cwd().length} characters`);

    // Check for antivirus markers by measuring file read time
    try {
      // Using dynamic import to avoid require
      const fs = await import('fs');
      const startTime = performance.now();
      fs.readFileSync(process.execPath);
      console.log(
        `- Time to read Node.js executable: ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`- Error reading Node.js executable: ${errorMessage}`);
    }
  }

  console.log('=======================\n');
}

// Initial mark for module load time
mark('Module initialization');
