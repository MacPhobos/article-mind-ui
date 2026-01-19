<script lang="ts">
	import { addUrlArticle } from '$lib/api/articles';

	interface Props {
		sessionId: number;
		onArticleAdded?: () => void;
	}
	let { sessionId, onArticleAdded }: Props = $props();

	// State
	let url = $state('');
	let title = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!url.trim()) {
			error = 'URL is required';
			return;
		}

		try {
			loading = true;
			error = null;

			await addUrlArticle(sessionId, {
				url: url.trim(),
				title: title.trim() || null
			});

			// Reset form
			url = '';
			title = '';

			onArticleAdded?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add article';
		} finally {
			loading = false;
		}
	}
</script>

<form class="add-url-form" onsubmit={handleSubmit}>
	<h3>Add Article from URL</h3>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<div class="form-group">
		<label for="url">URL *</label>
		<input
			type="url"
			id="url"
			bind:value={url}
			placeholder="https://example.com/article"
			required
			disabled={loading}
		/>
	</div>

	<div class="form-group">
		<label for="title">Title (optional)</label>
		<input
			type="text"
			id="title"
			bind:value={title}
			placeholder="Article title"
			disabled={loading}
		/>
	</div>

	<button type="submit" disabled={loading}>
		{loading ? 'Adding...' : 'Add URL'}
	</button>
</form>

<style>
	.add-url-form {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #374151;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.25rem;
	}

	input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #2563eb;
	}

	button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
</style>
