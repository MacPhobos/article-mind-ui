<script lang="ts">
	import AdminTaskCard from '$lib/components/admin/AdminTaskCard.svelte';
	import ProviderSelectionModal from '$lib/components/admin/ProviderSelectionModal.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { startReindex, cancelReindex } from '$lib/api/admin';
	import { subscribeToProgress, type ProgressEvent } from '$lib/api/sse';

	// Modal state
	let showReindexModal = $state(false);
	let showProviderModal = $state(false);
	let isReindexing = $state(false);
	let reindexProgress = $state(0);
	let reindexStatus = $state<'idle' | 'running' | 'success' | 'error'>('idle');
	let reindexError = $state<string | null>(null);
	let reindexMessage = $state<string | null>(null);
	let taskId = $state<string | null>(null);
	let errors = $state<Array<{ item_id: string; error: string }>>([]);
	let totalArticles = $state<number>(0);
	let processedArticles = $state<number>(0);

	// SSE cleanup function
	let unsubscribe: (() => void) | null = null;

	// Cleanup SSE when modal closes
	$effect(() => {
		if (!showReindexModal && unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	});

	function openReindexModal() {
		showReindexModal = true;
		reindexStatus = 'idle';
		reindexProgress = 0;
		reindexError = null;
		reindexMessage = null;
		errors = [];
		taskId = null;
		totalArticles = 0;
		processedArticles = 0;
	}

	function openProviderModal() {
		showProviderModal = true;
	}

	function closeProviderModal() {
		showProviderModal = false;
	}

	function closeReindexModal() {
		if (isReindexing) {
			if (!confirm('Reindex is in progress. Close anyway?')) {
				return;
			}
		}

		// Cleanup SSE subscription
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}

		showReindexModal = false;
		reindexStatus = 'idle';
		reindexProgress = 0;
		reindexError = null;
		reindexMessage = null;
		errors = [];
		taskId = null;
		isReindexing = false;
	}

	async function handleReindex() {
		isReindexing = true;
		reindexStatus = 'running';
		reindexProgress = 0;
		reindexError = null;
		reindexMessage = 'Starting reindex...';
		errors = [];

		try {
			// Start reindex task and get task ID
			const result = await startReindex({ force: true });
			taskId = result.task_id;
			totalArticles = result.total_articles;
			reindexMessage = `Reindexing ${result.total_articles} articles...`;

			// Subscribe to SSE progress updates
			unsubscribe = subscribeToProgress(result.task_id, handleProgress, handleSSEError);
		} catch (error) {
			reindexStatus = 'error';
			reindexError = error instanceof Error ? error.message : 'Failed to start reindex';
			reindexMessage = null;
			isReindexing = false;
		}
	}

	function handleProgress(event: ProgressEvent) {
		// Update progress percentage
		if (event.total_items > 0) {
			reindexProgress = Math.round((event.processed_items / event.total_items) * 100);
			processedArticles = event.processed_items;
			totalArticles = event.total_items;
		}

		// Update message
		reindexMessage =
			event.message ?? `Processed ${event.processed_items} of ${event.total_items} articles`;

		// Update errors list
		if (event.errors && event.errors.length > 0) {
			errors = event.errors;
		}

		// Handle completion
		if (event.status === 'completed') {
			reindexStatus = 'success';
			reindexMessage = `Completed! ${event.processed_items} articles reindexed.`;
			if (event.failed_items > 0) {
				reindexMessage += ` (${event.failed_items} failed)`;
			}
			isReindexing = false;

			// Auto-close after 3 seconds on success
			setTimeout(() => {
				if (reindexStatus === 'success') {
					closeReindexModal();
				}
			}, 3000);
		} else if (event.status === 'failed') {
			reindexStatus = 'error';
			reindexError = event.message ?? 'Reindex failed';
			reindexMessage = null;
			isReindexing = false;
		} else if (event.status === 'cancelled') {
			reindexStatus = 'error';
			reindexError = 'Reindex was cancelled';
			reindexMessage = null;
			isReindexing = false;
		}
	}

	function handleSSEError(error: Event) {
		console.error('SSE connection error:', error);
		reindexStatus = 'error';
		reindexError = 'Connection lost. The reindex may still be running on the server.';
		reindexMessage = null;
		isReindexing = false;
	}

	async function handleCancel() {
		if (taskId) {
			try {
				await cancelReindex(taskId);
				reindexMessage = 'Cancelling...';
			} catch (error) {
				reindexError = error instanceof Error ? error.message : 'Failed to cancel reindex';
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isReindexing) {
			closeReindexModal();
		}
	}
</script>

<div class="page-container">
	<header class="page-header">
		<h1>Admin Panel</h1>
		<p class="page-description">System administration and maintenance tasks</p>
	</header>

	<section class="tasks-section">
		<h2>Database Tasks</h2>
		<div class="tasks-grid">
			<AdminTaskCard
				title="Reindex Embeddings"
				description="Rebuild vector embeddings for all articles. Use this after updating the embedding model or if search results seem incorrect."
				icon="🔄"
				onclick={openReindexModal}
			/>
		</div>
	</section>

	<section class="tasks-section">
		<h2>Configuration</h2>
		<div class="tasks-grid">
			<AdminTaskCard
				title="Configure Providers"
				description="Select which LLM and embedding providers to use. Changing embedding providers requires reindexing all articles."
				icon="⚙️"
				onclick={openProviderModal}
			/>
		</div>
	</section>
</div>

<ProviderSelectionModal isOpen={showProviderModal} onClose={closeProviderModal} />

{#if showReindexModal}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="modal-content">
			<header class="modal-header">
				<h2>Reindex Embeddings</h2>
				{#if !isReindexing}
					<button class="close-btn" onclick={closeReindexModal} aria-label="Close modal">
						&times;
					</button>
				{/if}
			</header>

			<div class="modal-body">
				{#if reindexStatus === 'idle'}
					<p>
						This will rebuild vector embeddings for all articles in the database. This process may
						take several minutes depending on the number of articles.
					</p>
					<div class="warning-box">
						<strong>⚠️ Warning:</strong> Search functionality will be temporarily affected during reindexing.
					</div>
				{:else if reindexStatus === 'running'}
					<p>Reindexing in progress. Please do not close this window.</p>
					<ProgressBar value={reindexProgress} label="{reindexProgress}%" />
					{#if reindexMessage}
						<p class="status-message">{reindexMessage}</p>
					{/if}
					{#if totalArticles > 0}
						<p class="article-count">{processedArticles} / {totalArticles} articles processed</p>
					{/if}
					{#if errors.length > 0}
						<details class="error-details">
							<summary>{errors.length} error(s) occurred</summary>
							<ul>
								{#each errors as error (error.item_id)}
									<li><strong>Article {error.item_id}:</strong> {error.error}</li>
								{/each}
							</ul>
						</details>
					{/if}
				{:else if reindexStatus === 'success'}
					<div class="success-box">
						<strong>✓ Success!</strong>
						{reindexMessage || 'Embeddings have been reindexed successfully.'}
					</div>
					<ProgressBar value={100} variant="success" />
					{#if errors.length > 0}
						<details class="error-details">
							<summary>{errors.length} error(s) occurred</summary>
							<ul>
								{#each errors as error (error.item_id)}
									<li><strong>Article {error.item_id}:</strong> {error.error}</li>
								{/each}
							</ul>
						</details>
					{/if}
				{:else if reindexStatus === 'error'}
					<div class="error-box">
						<strong>✗ Error:</strong>
						{reindexError || 'An unknown error occurred'}
					</div>
					{#if reindexProgress > 0}
						<ProgressBar value={reindexProgress} variant="error" />
					{/if}
					{#if errors.length > 0}
						<details class="error-details">
							<summary>{errors.length} error(s) occurred</summary>
							<ul>
								{#each errors as error (error.item_id)}
									<li><strong>Article {error.item_id}:</strong> {error.error}</li>
								{/each}
							</ul>
						</details>
					{/if}
				{/if}
			</div>

			<footer class="modal-footer">
				{#if reindexStatus === 'idle'}
					<button class="btn-cancel" onclick={closeReindexModal}> Cancel </button>
					<button class="btn-submit" onclick={handleReindex}> Start Reindexing </button>
				{:else if reindexStatus === 'running'}
					<button class="btn-cancel" onclick={handleCancel}> Cancel Operation </button>
				{:else if reindexStatus === 'error'}
					<button class="btn-cancel" onclick={closeReindexModal}> Close </button>
					<button class="btn-submit" onclick={handleReindex}> Retry </button>
				{:else if reindexStatus === 'success'}
					<button class="btn-submit" onclick={closeReindexModal}> Close </button>
				{/if}
			</footer>
		</div>
	</div>
{/if}

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 3rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		color: #333;
	}

	.page-description {
		margin: 0;
		color: #666;
		font-size: 1rem;
	}

	.tasks-section {
		margin-bottom: 3rem;
	}

	.tasks-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
		font-weight: 600;
	}

	.tasks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 100%;
		max-width: 500px;
		margin: 1rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #666;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #333;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-body p {
		margin: 0 0 1rem 0;
		color: #666;
		line-height: 1.5;
	}

	.status-message {
		font-size: 0.875rem;
		color: #555;
		margin-top: 0.75rem;
	}

	.article-count {
		font-size: 0.875rem;
		color: #555;
		font-weight: 500;
		margin-top: 0.5rem;
	}

	.error-details {
		margin-top: 1rem;
		border: 1px solid #ef5350;
		border-radius: 4px;
		padding: 0.75rem;
		background: #ffebee;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 500;
		color: #d32f2f;
		user-select: none;
	}

	.error-details summary:hover {
		color: #b71c1c;
	}

	.error-details ul {
		margin: 0.75rem 0 0 0;
		padding-left: 1.5rem;
		list-style: disc;
	}

	.error-details li {
		margin: 0.5rem 0;
		color: #d32f2f;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.warning-box {
		background: #fff3e0;
		border: 1px solid #ffb74d;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #f57c00;
		font-size: 0.875rem;
		margin-top: 1rem;
	}

	.success-box {
		background: #e8f5e9;
		border: 1px solid #81c784;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #388e3c;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.error-box {
		background: #ffebee;
		border: 1px solid #ef5350;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #d32f2f;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.btn-cancel,
	.btn-submit {
		padding: 0.625rem 1.25rem;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-cancel {
		background: white;
		border: 1px solid #ddd;
		color: #666;
	}

	.btn-cancel:hover {
		background: #f5f5f5;
	}

	.btn-submit {
		background: #1976d2;
		border: 1px solid #1976d2;
		color: white;
	}

	.btn-submit:hover {
		background: #1565c0;
	}
</style>
