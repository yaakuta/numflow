/**
 * Async Task Scheduler
 *
 * Schedules asynchronous tasks after transaction completion.
 *
 * Key features:
 * 1. Queueing: Add async tasks to queue
 * 2. Background execution: Execute in background after transaction commit
 * 3. Error isolation: Async task failures don't affect main logic
 * 4. Logging: Log execution status
 */

import { AsyncTaskInfo, Context } from './types.js'

/**
 * Async Task Scheduler class
 */
export class AsyncTaskScheduler {
  private readonly tasks: AsyncTaskInfo[]
  private readonly context: Context

  constructor(tasks: AsyncTaskInfo[], context: Context) {
    this.tasks = tasks
    this.context = context
  }

  /**
   * Schedule all Async Tasks
   *
   * This method returns immediately, and tasks are executed in the background.
   */
  schedule(): void {
    if (this.tasks.length === 0) {
      return
    }

    this.log(`Scheduling ${this.tasks.length} async tasks...`)

    // Execute in background (without await)
    this.executeInBackground()
  }

  /**
   * Execute all Async Tasks in background
   */
  private async executeInBackground(): Promise<void> {
    // Execute each task sequentially
    for (const task of this.tasks) {
      try {
        await this.executeTask(task)
      } catch (error) {
        // Log async task failures and continue
        this.logError(
          `Async task "${task.name}" at ${task.path} failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    this.log(`All ${this.tasks.length} async tasks completed`)
  }

  /**
   * Execute single Async Task
   *
   * @param task - Async Task to execute
   */
  private async executeTask(task: AsyncTaskInfo): Promise<void> {
    this.log(`Executing async task: ${task.name}`)

    const startTime = Date.now()

    try {
      await task.fn(this.context)

      const duration = Date.now() - startTime
      this.log(`Async task "${task.name}" completed in ${duration}ms`)
    } catch (error) {
      // Propagate error to upper layer
      throw error
    }
  }

  /**
   * Output log
   *
   * @param message - Log message
   */
  private log(message: string): void {
    if (process.env.DISABLE_FEATURE_LOGS === 'true' || process.env.NODE_ENV === 'test') {
      return
    }
    console.log(`[AsyncTaskScheduler] ${message}`)
  }

  /**
   * Output error log
   *
   * @param message - Error message
   */
  private logError(message: string): void {
    if (process.env.DISABLE_FEATURE_LOGS === 'true' || process.env.NODE_ENV === 'test') {
      return
    }
    console.error(`[AsyncTaskScheduler] ERROR: ${message}`)
  }
}

/**
 * Schedule Async Tasks (helper function)
 *
 * @param tasks - Async Task list
 * @param context - Context object
 */
export function scheduleAsyncTasks(tasks: AsyncTaskInfo[], context: Context): void {
  const scheduler = new AsyncTaskScheduler(tasks, context)
  scheduler.schedule()
}
