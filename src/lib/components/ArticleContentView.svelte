<script lang="ts">
	import { getArticleContent } from '$lib/api/articles';
	import type { ArticleContentResponse, ArticleResponse } from '$lib/api/types';

	interface Props {
		sessionId: number;
		article: ArticleResponse;
		onClose: () => void;
	}
	let { sessionId, article, onClose }: Props = $props();

	// State
	let content = $state<ArticleContentResponse | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Fetch content when component mounts
	$effect(() => {
		fetchContent();
	});

	async function fetchContent() {
		if (article.extraction_status !== 'completed') {
			error = 'Article content is not yet available. Extraction status: ' + article.extraction_status;
			return;
		}

		loading = true;
		error = null;

		try {
			content = await getArticleContent(sessionId, article.id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load article content';
			console.error('Error fetching article content:', err);
		} finally {
			loading = false;
		}
	}

	function formatMetadataValue(value: unknown): string {
		if (value === null || value === undefined) return 'N/A';
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}

	// Calculate word count from content
	let wordCount = $derived(
		content ? content.content_text.trim().split(/\s+/).filter((w) => w.length > 0).length : 0
	);

	// Calculate reading time (assuming 200 words per minute)
	let readingTime = $derived(Math.max(1, Math.ceil(wordCount / 200)));
</script>

<div class="overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
	<div
		class="modal"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal-header">
			<h2>{article.title || `Article #${article.id}`}</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">&times;</button>
		</div>

		{#if loading}
			<div class="modal-body">
				<div class="loading">Loading content...</div>
			</div>
		{:else if error}
			<div class="modal-body">
				<div class="error">
					<p>{error}</p>
					<button onclick={fetchContent}>Retry</button>
				</div>
			</div>
		{:else if content}
			<div class="modal-body">
				<!-- Metadata Section -->
				<div class="metadata-section">
					<div class="metadata-grid">
						<div class="metadata-item">
							<span class="metadata-label">Word Count:</span>
							<span class="metadata-value">{wordCount.toLocaleString()}</span>
						</div>
						<div class="metadata-item">
							<span class="metadata-label">Reading Time:</span>
							<span class="metadata-value">{readingTime} min</span>
						</div>
						<div class="metadata-item">
							<span class="metadata-label">Status:</span>
							<span class="metadata-value status-{content.extraction_status}">
								{content.extraction_status}
							</span>
						</div>
					</div>
				</div>

				<!-- Content Section -->
				<div class="content-section">
					<h3>Article Content</h3>
					<div class="content-text">
						{content.content_text}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
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
		padding: 2rem;
	}

	.modal {
		background: white;
		border-radius: 8px;
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		padding-right: 1rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		color: #9ca3af;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
	}

	.close-btn:hover {
		color: #ef4444;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.loading,
	.error {
		text-align: center;
		padding: 3rem;
	}

	.loading {
		color: #666;
	}

	.error {
		color: #ef4444;
	}

	.error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.metadata-section {
		background: #f9fafb;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.metadata-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.metadata-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metadata-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metadata-value {
		font-size: 0.95rem;
		color: #1f2937;
		font-weight: 500;
	}

	.metadata-value.status-completed {
		color: #22c55e;
	}

	.metadata-value.status-processing {
		color: #3b82f6;
	}

	.metadata-value.status-failed {
		color: #ef4444;
	}

	.metadata-value.status-pending {
		color: #9ca3af;
	}

	.content-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #1f2937;
		font-weight: 600;
	}

	.content-text {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1.5rem;
		line-height: 1.8;
		color: #374151;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		font-size: 0.95rem;
	}

	/* Scrollbar styling */
	.modal-body::-webkit-scrollbar {
		width: 8px;
	}

	.modal-body::-webkit-scrollbar-track {
		background: #f3f4f6;
	}

	.modal-body::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 4px;
	}

	.modal-body::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
