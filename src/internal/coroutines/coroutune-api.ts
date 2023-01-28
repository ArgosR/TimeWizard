/**
 * A coroutine is a process running alongside the bot main process.
 * Unlike a command, this isn't user-triggered.
 * Unlike a Job, this doesn't end unless killed
 */
export interface ICoroutine {
  /**
   * Start the coroutine
   */
  start(): Promise<void>;
}
