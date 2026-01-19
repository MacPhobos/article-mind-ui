<script lang="ts">
	import type { ChatSource } from '$lib/api/types';
	import SourceCitations from './SourceCitations.svelte';

	// Props
	interface Props {
		role: 'user' | 'assistant';
		content: string;
		sources?: ChatSource[] | null;
		timestamp: string;
	}
	let { role, content, sources, timestamp }: Props = $props();

	// Format timestamp
	let formattedTime = $derived(
		new Date(timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	// Parse content into segments for safe rendering
	interface ContentSegment {
		text: string;
		isCitation: boolean;
	}

	let contentSegments = $derived<ContentSegment[]>(
		role !== 'assistant'
			? [{ text: content, isCitation: false }]
			: content
					.split(/(\[\d+\])/g)
					.filter((part) => part.length > 0)
					.map((part) => ({
						text: part,
						isCitation: /^\[\d+\]$/.test(part)
					}))
	);
</script>

<div class="message" class:user={role === 'user'} class:assistant={role === 'assistant'}>
	<div class="bubble">
		<div class="content">
			{#each contentSegments as segment, i (i)}
				{#if segment.isCitation}
					<span class="citation">{segment.text}</span>
				{:else}
					{segment.text}
				{/if}
			{/each}
		</div>

		{#if sources && sources.length > 0}
			<SourceCitations {sources} />
		{/if}
	</div>

	<span class="timestamp">{formattedTime}</span>
</div>

<style>
	.message {
		display: flex;
		flex-direction: column;
		max-width: 80%;
	}

	.message.user {
		align-self: flex-end;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.bubble {
		padding: 0.75rem 1rem;
		border-radius: 12px;
		line-height: 1.5;
	}

	.user .bubble {
		background: #3b82f6;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.assistant .bubble {
		background: #f3f4f6;
		color: #1f2937;
		border-bottom-left-radius: 4px;
	}

	.content {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.content :global(.citation) {
		color: #3b82f6;
		font-weight: 600;
		cursor: pointer;
	}

	.timestamp {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-top: 0.25rem;
		padding: 0 0.5rem;
	}

	.user .timestamp {
		text-align: right;
	}
</style>
