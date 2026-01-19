<script lang="ts">
	import type { ArticleResponse, ExtractionStatus } from '$lib/api/types';

	interface Props {
		article: ArticleResponse;
		onDelete: () => void;
	}
	let { article, onDelete }: Props = $props();

	// Derived state
	let displayName = $derived(
		article.title ||
			(article.type === 'url' ? article.original_url?.slice(0, 60) : article.original_filename) ||
			`Article #${article.id}`
	);

	let statusColor = $derived(getStatusColor(article.extraction_status));
	let statusText = $derived(getStatusText(article.extraction_status));

	function getStatusColor(status: ExtractionStatus): string {
		switch (status) {
			case 'completed':
				return '#22c55e';
			case 'processing':
				return '#3b82f6';
			case 'failed':
				return '#ef4444';
			default:
				return '#9ca3af';
		}
	}

	function getStatusText(status: ExtractionStatus): string {
		switch (status) {
			case 'completed':
				return 'Ready';
			case 'processing':
				return 'Processing';
			case 'failed':
				return 'Failed';
			default:
				return 'Pending';
		}
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="article-card">
	<div class="card-header">
		<span
			class="type-badge"
			class:url={article.type === 'url'}
			class:file={article.type === 'file'}
		>
			{article.type === 'url' ? 'URL' : 'File'}
		</span>
		<button
			class="delete-btn"
			onclick={onDelete}
			title="Delete article"
			aria-label="Delete article"
		>
			&times;
		</button>
	</div>

	<h3 class="title">{displayName}</h3>

	{#if article.type === 'url' && article.original_url}
		<!-- External link to article source - no resolve() needed -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={article.original_url} target="_blank" rel="noopener noreferrer" class="source-link">
			View source
		</a>
	{/if}

	<div class="card-footer">
		<span class="status" style="--status-color: {statusColor}">
			{statusText}
		</span>
		<span class="date">{formatDate(article.created_at)}</span>
	</div>
</div>

<style>
	.article-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.type-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.type-badge.url {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.type-badge.file {
		background: #f3e8ff;
		color: #7c3aed;
	}

	.delete-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.delete-btn:hover {
		color: #ef4444;
	}

	.title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.source-link {
		font-size: 0.875rem;
		color: #3b82f6;
		text-decoration: none;
	}

	.source-link:hover {
		text-decoration: underline;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px solid #f3f4f6;
	}

	.status {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--status-color);
	}

	.date {
		font-size: 0.75rem;
		color: #9ca3af;
	}
</style>
