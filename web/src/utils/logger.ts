/**
 * Development-only logger utility
 * Logs messages only in development environment
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const devInfo = (...args: any[]) => {
  if (isDevelopment) {
    console.info(...args);
  }
};
