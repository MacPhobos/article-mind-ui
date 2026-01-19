<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SessionResponse } from '$lib/api/types';

	interface Props {
		session: SessionResponse;
		onEdit?: (session: SessionResponse) => void;
		onDelete?: (session: SessionResponse) => void;
		onArchive?: (session: SessionResponse) => void;
	}

	let { session, onEdit, onDelete, onArchive }: Props = $props();

	// Format dates for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Status badge color mapping
	let statusColor = $derived(() => {
		switch (session.status) {
			case 'draft':
				return 'badge-draft';
			case 'active':
				return 'badge-active';
			case 'completed':
				return 'badge-completed';
			case 'archived':
				return 'badge-archived';
			default:
				return 'badge-draft';
		}
	});
</script>

<article class="session-card">
	<a href={resolve(`/sessions/${session.id}`)} class="card-link">
		<header class="card-header">
			<h3 class="session-name">{session.name}</h3>
			<span class="status-badge {statusColor()}">{session.status}</span>
		</header>

		{#if session.description}
			<p class="session-description">{session.description}</p>
		{/if}

		<footer class="card-footer">
			<div class="meta-info">
				<span class="article-count">{session.article_count ?? 0} articles</span>
				<span class="date-info">Created {formatDate(session.created_at)}</span>
				{#if session.updated_at !== session.created_at}
					<span class="date-info">Updated {formatDate(session.updated_at)}</span>
				{/if}
			</div>
		</footer>
	</a>

	<div class="card-actions">
		{#if onEdit && session.status !== 'archived'}
			<button class="btn-action" onclick={() => onEdit?.(session)} aria-label="Edit session">
				Edit
			</button>
		{/if}
		{#if onArchive && session.status !== 'archived'}
			<button
				class="btn-action btn-archive"
				onclick={() => onArchive?.(session)}
				aria-label="Archive session"
			>
				Archive
			</button>
		{/if}
		{#if onDelete}
			<button
				class="btn-action btn-delete"
				onclick={() => onDelete?.(session)}
				aria-label="Delete session"
			>
				Delete
			</button>
		{/if}
	</div>
</article>

<style>
	.session-card {
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.session-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.session-name {
		margin: 0;
		font-size: 1.25rem;
		color: #333;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.badge-draft {
		background: #f0f0f0;
		color: #666;
	}
	.badge-active {
		background: #e3f2fd;
		color: #1976d2;
	}
	.badge-completed {
		background: #e8f5e9;
		color: #388e3c;
	}
	.badge-archived {
		background: #fafafa;
		color: #9e9e9e;
	}

	.session-description {
		color: #666;
		font-size: 0.9rem;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.card-footer {
		border-top: 1px solid #f0f0f0;
		padding-top: 0.75rem;
		margin-top: 0.75rem;
	}

	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.8rem;
		color: #888;
	}

	.article-count {
		font-weight: 500;
		color: #666;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f0f0f0;
	}

	.btn-action {
		padding: 0.375rem 0.75rem;
		font-size: 0.8rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-action:hover {
		background: #f5f5f5;
	}

	.btn-archive:hover {
		background: #fff3e0;
		border-color: #ffb74d;
		color: #f57c00;
	}

	.btn-delete:hover {
		background: #ffebee;
		border-color: #ef5350;
		color: #d32f2f;
	}
</style>
