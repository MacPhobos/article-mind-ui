/**
 * Admin API client functions
 *
 * Design Decision: Dedicated admin module separate from main API client
 *
 * Rationale: Admin operations are privileged and may require different
 * authentication/authorization in the future. Separating into dedicated
 * module makes it easier to add auth guards, rate limiting, or audit logging.
 *
 * Trade-offs:
 * - Organization: Clear separation of admin vs. user operations
 * - Future-proofing: Easy to add admin-specific middleware (auth, logging)
 * - Discoverability: All admin operations in one import location
 *
 * Alternatives Considered:
 * 1. Single client.ts: Rejected - admin ops should be clearly separated
 * 2. Per-task files: Rejected - too granular for current scale (only reindex)
 *
 * Future Extensibility: Add new admin tasks by adding functions here:
 * - exportSessionData()
 * - importArticles()
 * - clearCache()
 * - databaseMaintenance()
 */

import { apiClient } from './client';

/**
 * Options for starting a reindex operation
 */
export interface ReindexOptions {
	sessionIds?: number[]; // Null or undefined = all sessions
	force?: boolean; // Force reindex even if status is 'completed'
}

/**
 * Result from starting a reindex task
 *
 * Mirrors AdminReindexResponse from backend:
 * article-mind-service/schemas/admin.py
 */
export interface ReindexResult {
	task_id: string;
	total_sessions: number;
	total_articles: number;
	progress_url: string; // URL for SSE progress streaming
}

/**
 * Current status of a background task
 *
 * Mirrors TaskStatusResponse from backend:
 * article-mind-service/schemas/admin.py
 */
export interface TaskStatus {
	task_id: string;
	task_type: string;
	status: string;
	total_items: number;
	processed_items: number;
	failed_items: number;
	progress_percent: number;
	message: string | null;
	errors: Array<{ item_id: string; error: string }>;
}

/**
 * Start a reindex operation for all or selected sessions
 *
 * Performance: This endpoint starts background task and returns immediately.
 * Actual reindexing happens asynchronously. Use subscribeToProgress() from
 * sse.ts to track real-time progress.
 *
 * Error Handling:
 * - 400: Invalid session IDs or malformed request
 * - 409: Reindex already in progress (if backend enforces single-task)
 * - 500: Failed to start background task
 *
 * @param options - Reindex configuration
 * @returns Task information including task_id for progress tracking
 *
 * @example
 * const result = await startReindex({ force: true });
 * console.log(`Started task ${result.task_id} for ${result.total_articles} articles`);
 *
 * // Subscribe to progress updates
 * const unsubscribe = subscribeToProgress(result.task_id, (event) => {
 *   console.log(`Progress: ${event.processed_items}/${event.total_items}`);
 * });
 */
export async function startReindex(options: ReindexOptions = {}): Promise<ReindexResult> {
	return apiClient.post('/api/v1/admin/reindex', {
		session_ids: options.sessionIds ?? null,
		force: options.force ?? false
	});
}

/**
 * Get final status of a completed or failed task
 *
 * Use Case: Query task status after SSE connection is closed or for
 * task history display. For real-time updates, use subscribeToProgress().
 *
 * Error Handling:
 * - 404: Task ID not found (expired or invalid)
 * - 410: Task expired from in-memory registry (implement persistence to fix)
 *
 * @param taskId - Unique task identifier
 * @returns Current task status with error details if failed
 *
 * @example
 * const status = await getReindexStatus(taskId);
 * if (status.status === 'completed') {
 *   console.log(`Processed ${status.processed_items} articles`);
 * } else if (status.status === 'failed') {
 *   console.error(`Failed with ${status.errors.length} errors`);
 * }
 */
export async function getReindexStatus(taskId: string): Promise<TaskStatus> {
	return apiClient.get(`/api/v1/admin/reindex/${taskId}`);
}

/**
 * Request cancellation of a running reindex task
 *
 * Graceful Cancellation: Sets cancellation flag. Background task checks flag
 * between articles and stops gracefully. Current article finishes processing
 * before task stops.
 *
 * Error Handling:
 * - 404: Task ID not found
 * - 409: Task already completed or not running
 *
 * Important: Cancellation is not instantaneous. Use SSE stream to detect when
 * status changes to 'cancelled'.
 *
 * @param taskId - Unique task identifier
 *
 * @example
 * await cancelReindex(taskId);
 * // Wait for SSE event with status: 'cancelled'
 */
export async function cancelReindex(taskId: string): Promise<void> {
	await apiClient.post(`/api/v1/admin/reindex/${taskId}/cancel`, {});
}
