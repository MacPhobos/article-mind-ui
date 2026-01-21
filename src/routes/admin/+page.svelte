<script lang="ts">
	import AdminTaskCard from '$lib/components/admin/AdminTaskCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	// Modal state
	let showReindexModal = $state(false);
	let isReindexing = $state(false);
	let reindexProgress = $state(0);
	let reindexStatus = $state<'idle' | 'running' | 'success' | 'error'>('idle');
	let reindexError = $state<string | null>(null);

	function openReindexModal() {
		showReindexModal = true;
		reindexStatus = 'idle';
		reindexProgress = 0;
		reindexError = null;
	}

	function closeReindexModal() {
		if (isReindexing) return; // Prevent closing during operation
		showReindexModal = false;
		reindexStatus = 'idle';
		reindexProgress = 0;
		reindexError = null;
	}

	async function handleReindex() {
		isReindexing = true;
		reindexStatus = 'running';
		reindexProgress = 0;
		reindexError = null;

		try {
			// TODO: Replace with actual API call when backend endpoint is ready
			// Simulating progress for now
			for (let i = 0; i <= 100; i += 10) {
				await new Promise((resolve) => setTimeout(resolve, 300));
				reindexProgress = i;
			}

			reindexStatus = 'success';
			setTimeout(() => {
				closeReindexModal();
			}, 2000);
		} catch (error) {
			reindexStatus = 'error';
			reindexError = error instanceof Error ? error.message : 'Failed to reindex embeddings';
		} finally {
			isReindexing = false;
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
</div>

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
					<ProgressBar value={reindexProgress} label="Progress" />
				{:else if reindexStatus === 'success'}
					<div class="success-box">
						<strong>✓ Success!</strong> Embeddings have been reindexed successfully.
					</div>
					<ProgressBar value={100} variant="success" />
				{:else if reindexStatus === 'error'}
					<div class="error-box">
						<strong>✗ Error:</strong>
						{reindexError || 'An unknown error occurred'}
					</div>
					<ProgressBar value={reindexProgress} variant="error" />
				{/if}
			</div>

			<footer class="modal-footer">
				{#if reindexStatus === 'idle'}
					<button class="btn-cancel" onclick={closeReindexModal}> Cancel </button>
					<button class="btn-submit" onclick={handleReindex}> Start Reindexing </button>
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
