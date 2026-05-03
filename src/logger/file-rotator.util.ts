import * as fs from 'fs/promises';
import * as path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE_NAME = 'app.log';

let writeQueue: Promise<void> = Promise.resolve();
let isRotating = false;

function getConfiguredMaxFileSize(): number {
  const envSize = process.env.LOG_MAX_FILE_SIZE;

  if (!envSize) {
    return 1024;
  }

  const parsed = parseInt(envSize, 10);
  return isNaN(parsed) ? 1024 : parsed;
}

async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
  }
}

function getLogFilePath(): string {
  return path.join(LOG_DIR, LOG_FILE_NAME);
}

function getArchivedLogFilePath(timestamp: string): string {
  const safeTimestamp = timestamp.replace(/\.\d{3}Z$/, '').replace(/:/g, '-');
  return path.join(LOG_DIR, `app-${safeTimestamp}.log`);
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function getFileSizeInKB(filePath: string): Promise<number> {
  return (await getFileSize(filePath)) / 1024;
}

async function rotateLog(): Promise<void> {
  if (isRotating) {
    return;
  }

  isRotating = true;

  try {
    const logFilePath = getLogFilePath();

    try {
      await fs.access(logFilePath);
    } catch {
      return;
    }

    const maxSizeKB = getConfiguredMaxFileSize();
    const currentSizeKB = await getFileSizeInKB(logFilePath);

    if (currentSizeKB >= maxSizeKB) {
      const timestamp = new Date().toISOString();
      const archivedPath = getArchivedLogFilePath(timestamp);
      await fs.rename(logFilePath, archivedPath);
    }
  } finally {
    isRotating = false;
  }
}

async function writeToFileInternal(message: string): Promise<void> {
  await ensureLogDirectory();
  await rotateLog();

  const logFilePath = getLogFilePath();
  await fs.appendFile(logFilePath, `${message}\n`, { encoding: 'utf-8' });
}

export function writeToFile(message: string): void {
  writeQueue = writeQueue
    .then(() => writeToFileInternal(message))
    .catch((err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown logging error';
      process.stderr.write(`[LOGGER_ERROR] ${errorMessage}\n`);
    });
}

export function getLogDir(): string {
  return LOG_DIR;
}

export async function flushWriteQueue(): Promise<void> {
  await writeQueue;
}
