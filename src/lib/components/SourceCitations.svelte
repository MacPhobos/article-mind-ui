<script lang="ts">
	import type { ChatSource } from '$lib/api/types';

	// Props
	interface Props {
		sources: ChatSource[];
	}
	let { sources }: Props = $props();

	// State
	let isExpanded = $state(false);
</script>

<div class="sources">
	<button
		class="toggle-btn"
		onclick={() => (isExpanded = !isExpanded)}
		aria-expanded={isExpanded}
	>
		<span class="icon">{isExpanded ? '▼' : '▶'}</span>
		{sources.length} source{sources.length !== 1 ? 's' : ''}
	</button>

	{#if isExpanded}
		<ul class="sources-list">
			{#each sources as source (source.article_id)}
				<li>
					<span class="citation-number">[{source.article_id}]</span>
					<div class="source-details">
						{#if source.url}
							<a href={source.url} target="_blank" rel="noopener noreferrer external">
								{source.title || 'Untitled'}
							</a>
						{:else}
							<span class="title">{source.title || 'Untitled'}</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sources {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: #6b7280;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 4px;
	}

	.toggle-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.icon {
		font-size: 0.625rem;
	}

	.sources-list {
		list-style: none;
		margin: 0.5rem 0 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.sources-list li {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.citation-number {
		color: #3b82f6;
		font-weight: 600;
		flex-shrink: 0;
	}

	.source-details {
		flex: 1;
		min-width: 0;
	}

	.source-details a {
		color: #2563eb;
		text-decoration: none;
	}

	.source-details a:hover {
		text-decoration: underline;
	}

	.title {
		color: #374151;
	}
</style>
