<script lang="ts">
	import { onMount } from 'svelte';
	import { getArticles, deleteArticle } from '$lib/api/articles';
	import type { ArticleResponse } from '$lib/api/types';
	import ArticleCard from './ArticleCard.svelte';

	interface Props {
		sessionId: number;
		onArticleDeleted?: () => void;
		onArticleViewContent?: (article: ArticleResponse) => void;
	}
	let { sessionId, onArticleDeleted, onArticleViewContent }: Props = $props();

	// State
	let articles = $state<ArticleResponse[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Fetch articles
	async function fetchArticles() {
		try {
			loading = true;
			error = null;
			const response = await getArticles(sessionId);
			articles = response.items;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load articles';
			console.error('Error fetching articles:', err);
		} finally {
			loading = false;
		}
	}

	// Handle delete
	async function handleDelete(articleId: number) {
		if (!confirm('Are you sure you want to delete this article?')) {
			return;
		}

		try {
			await deleteArticle(sessionId, articleId);
			articles = articles.filter((a) => a.id !== articleId);
			onArticleDeleted?.();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to delete article');
		}
	}

	// Expose refresh method
	export function refresh() {
		fetchArticles();
	}

	onMount(() => {
		fetchArticles();
	});
</script>

<div class="article-list">
	{#if loading}
		<div class="loading">Loading articles...</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button onclick={fetchArticles}>Retry</button>
		</div>
	{:else if articles.length === 0}
		<div class="empty">
			<p>No articles yet. Add one using the form above.</p>
		</div>
	{:else}
		<div class="articles-grid">
			{#each articles as article (article.id)}
				<ArticleCard
					{article}
					onDelete={() => handleDelete(article.id)}
					onViewContent={() => onArticleViewContent?.(article)}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.article-list {
		width: 100%;
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		padding: 2rem;
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

	.articles-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}
</style>
