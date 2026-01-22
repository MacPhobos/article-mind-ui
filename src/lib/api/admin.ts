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

/**
 * Provider configuration response
 *
 * Mirrors ProviderConfigResponse from backend:
 * article-mind-service/schemas/settings.py
 */
export interface ProviderConfig {
	embedding_provider: 'openai' | 'ollama';
	embedding_provider_available: string[];
	llm_provider: 'openai' | 'anthropic';
	llm_provider_available: string[];
}

/**
 * Response when updating embedding provider
 *
 * Mirrors UpdateEmbeddingProviderResponse from backend:
 * article-mind-service/schemas/settings.py
 */
export interface UpdateEmbeddingProviderResponse {
	provider: string;
	reindex_triggered: boolean;
	warning?: string | null;
}

/**
 * Response when updating LLM provider
 *
 * Mirrors UpdateLlmProviderResponse from backend:
 * article-mind-service/schemas/settings.py
 */
export interface UpdateLlmProviderResponse {
	provider: string;
}

/**
 * Get current provider configuration
 *
 * Returns the currently active embedding and LLM providers, plus the list
 * of available providers (those with API keys configured).
 *
 * Error Handling:
 * - 500: Failed to read configuration
 *
 * @returns Current provider configuration with availability info
 *
 * @example
 * const config = await getProviderConfig();
 * console.log(`Embedding: ${config.embedding_provider}`);
 * console.log(`LLM: ${config.llm_provider}`);
 * console.log(`Available embedding: ${config.embedding_provider_available.join(', ')}`);
 */
export async function getProviderConfig(): Promise<ProviderConfig> {
	return apiClient.get('/api/v1/settings/providers');
}

/**
 * Update embedding provider
 *
 * Changes the active embedding provider. If dimensions differ between old and
 * new providers, requires confirm_reindex=true to trigger reindexing.
 *
 * Design Decision: Explicit reindex confirmation prevents accidental data loss.
 * Different embedding providers use different dimensions (OpenAI: 1536, Ollama: 1024).
 *
 * Error Handling:
 * - 400: Invalid provider or provider not available (missing API key)
 * - 409: Dimension mismatch but confirm_reindex=false (returns warning)
 * - 500: Failed to update configuration or start reindex
 *
 * @param provider - Target embedding provider
 * @param confirmReindex - Acknowledge reindex requirement if dimensions change
 * @returns Response with reindex status and any warnings
 *
 * @example
 * // First attempt without confirmation
 * const result1 = await updateEmbeddingProvider('openai', false);
 * if (result1.warning) {
 *   console.warn(result1.warning);
 *   // Prompt user for confirmation
 * }
 *
 * // Confirmed reindex
 * const result2 = await updateEmbeddingProvider('openai', true);
 * if (result2.reindex_triggered) {
 *   console.log('Reindex started');
 * }
 */
export async function updateEmbeddingProvider(
	provider: 'openai' | 'ollama',
	confirmReindex: boolean
): Promise<UpdateEmbeddingProviderResponse> {
	return apiClient.patch('/api/v1/settings/providers/embedding', {
		provider,
		confirm_reindex: confirmReindex
	});
}

/**
 * Update LLM provider
 *
 * Changes the active LLM provider. This is a non-destructive operation that
 * doesn't require reindexing since it only affects text generation.
 *
 * Error Handling:
 * - 400: Invalid provider or provider not available (missing API key)
 * - 500: Failed to update configuration
 *
 * @param provider - Target LLM provider
 * @returns Response confirming the new provider
 *
 * @example
 * const result = await updateLlmProvider('anthropic');
 * console.log(`LLM provider changed to: ${result.provider}`);
 */
export async function updateLlmProvider(
	provider: 'openai' | 'anthropic'
): Promise<UpdateLlmProviderResponse> {
	return apiClient.patch('/api/v1/settings/providers/llm', {
		provider
	});
}
