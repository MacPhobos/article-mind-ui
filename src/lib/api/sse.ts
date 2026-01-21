/**
 * Server-Sent Events (SSE) utility for real-time progress tracking
 *
 * Design Decision: EventSource-based streaming for admin progress
 *
 * Rationale: SSE chosen over WebSockets for unidirectional progress updates.
 * Simpler protocol, automatic reconnection, and native browser support make it
 * ideal for admin operations where server pushes progress but client doesn't
 * send updates during the stream.
 *
 * Trade-offs:
 * - Simplicity: SSE is HTTP-based, no special server config vs. WebSocket complexity
 * - Reconnection: Browser handles reconnect automatically vs. manual WebSocket handling
 * - Limitation: Unidirectional only (server→client), but sufficient for progress tracking
 *
 * Alternatives Considered:
 * 1. WebSockets: Rejected - overkill for one-way progress updates
 * 2. Polling: Rejected - inefficient for real-time updates, higher server load
 * 3. Long polling: Rejected - SSE is cleaner and better supported
 */

import { API_BASE_URL } from './client';

/**
 * Progress event sent from backend via SSE
 *
 * Mirrors TaskProgress from backend: article-mind-service/tasks/registry.py
 */
export interface ProgressEvent {
	task_id: string;
	task_type: string;
	status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
	total_items: number;
	processed_items: number;
	failed_items: number;
	current_item: string | null;
	message: string | null;
	errors: Array<{ item_id: string; error: string }>;
}

/**
 * Subscribe to progress updates for a task via Server-Sent Events
 *
 * Performance: SSE maintains single HTTP connection for entire operation.
 * Connection automatically closed on 'complete' event or error.
 *
 * Error Handling:
 * - EventSource.onerror: Network issues, server disconnect, or HTTP error
 * - JSON parse errors: Caught and logged, bad events are skipped
 * - Completion: EventSource is closed automatically to free resources
 *
 * Cleanup: Returns unsubscribe function for manual cleanup when component unmounts
 * or modal closes. MUST be called to prevent memory leaks.
 *
 * @param taskId - Unique task identifier from backend
 * @param onProgress - Callback for progress and complete events
 * @param onError - Optional callback for connection errors
 * @returns Cleanup function to close EventSource
 *
 * @example
 * const unsubscribe = subscribeToProgress(
 *   taskId,
 *   (event) => {
 *     setProgress(event.processed_items / event.total_items * 100);
 *     if (event.status === 'completed') {
 *       showSuccess();
 *     }
 *   },
 *   (error) => showError('Connection lost')
 * );
 *
 * // Later: cleanup when modal closes
 * unsubscribe();
 */
export function subscribeToProgress(
	taskId: string,
	onProgress: (event: ProgressEvent) => void,
	onError?: (error: Event) => void
): () => void {
	const url = `${API_BASE_URL}/api/v1/admin/reindex/${taskId}/progress`;
	const eventSource = new EventSource(url);

	// Progress event: emitted on each article processed
	eventSource.addEventListener('progress', (e: MessageEvent) => {
		try {
			const data = JSON.parse(e.data) as ProgressEvent;
			onProgress(data);
		} catch (parseError) {
			console.error('Failed to parse progress event:', parseError);
		}
	});

	// Complete event: task finished successfully or with errors
	eventSource.addEventListener('complete', (e: MessageEvent) => {
		try {
			const data = JSON.parse(e.data) as ProgressEvent;
			onProgress(data);
		} catch (parseError) {
			console.error('Failed to parse complete event:', parseError);
		} finally {
			eventSource.close(); // Close connection on completion
		}
	});

	// Error event: network failure, server error, or connection lost
	eventSource.onerror = (e: Event) => {
		console.error('SSE connection error:', e);
		onError?.(e);
		eventSource.close(); // Close connection on error
	};

	// Return cleanup function for manual unsubscribe
	return () => eventSource.close();
}
