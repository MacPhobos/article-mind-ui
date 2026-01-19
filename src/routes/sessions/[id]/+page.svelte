<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { apiClient } from '$lib/api/client';
	import type { SessionResponse } from '$lib/api/types';
	import ArticleList from '$lib/components/ArticleList.svelte';
	import AddUrlForm from '$lib/components/AddUrlForm.svelte';
	import FileUploadDropzone from '$lib/components/FileUploadDropzone.svelte';

	let sessionId = $derived($page.params.id ?? '');
	let sessionIdNum = $derived(parseInt(sessionId, 10));
	let session = $state<SessionResponse | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let articleListRef = $state<ArticleList | null>(null);

	// Load session when ID changes
	$effect(() => {
		if (sessionId) {
			loadSession(sessionId);
		}
	});

	async function loadSession(id: string) {
		isLoading = true;
		error = null;

		try {
			session = await apiClient.get<SessionResponse>(`/api/v1/sessions/${id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load session';
			console.error('Failed to load session:', e);
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function changeStatus(newStatus: string) {
		if (!session || !sessionId) return;

		try {
			await apiClient.post(`/api/v1/sessions/${session.id}/status`, {
				status: newStatus
			});
			await loadSession(sessionId);
		} catch (e) {
			console.error('Failed to change status:', e);
		}
	}

	function handleArticleAdded() {
		articleListRef?.refresh();
		// Refresh session to update article count
		if (sessionId) {
			loadSession(sessionId);
		}
	}
</script>

<div class="page-container">
	<nav class="breadcrumb">
		<a href={resolve('/')}>Sessions</a>
		<span>/</span>
		<span>{session?.name ?? 'Loading...'}</span>
	</nav>

	{#if isLoading}
		<div class="loading">Loading session...</div>
	{:else if error}
		<div class="error" role="alert">
			<p>{error}</p>
			<button onclick={() => goto(resolve('/'))}>Back to Sessions</button>
		</div>
	{:else if session}
		<header class="session-header">
			<div class="header-info">
				<h1>{session.name}</h1>
				<span class="status-badge status-{session.status}">{session.status}</span>
			</div>

			{#if session.description}
				<p class="description">{session.description}</p>
			{/if}

			<div class="meta">
				<span>Created: {formatDate(session.created_at)}</span>
				<span>Updated: {formatDate(session.updated_at)}</span>
				<span>{session.article_count ?? 0} articles</span>
			</div>
		</header>

		<section class="status-actions">
			<h2>Status Actions</h2>
			<div class="action-buttons">
				{#if session.status === 'draft'}
					<button onclick={() => changeStatus('active')}>Start Session</button>
				{/if}
				{#if session.status === 'active'}
					<button onclick={() => changeStatus('completed')}>Mark Complete</button>
				{/if}
				{#if session.status !== 'archived'}
					<button class="btn-archive" onclick={() => changeStatus('archived')}>
						Archive Session
					</button>
				{/if}
			</div>
		</section>

		<section class="add-article-section">
			<h2>Add Articles</h2>
			<div class="add-forms">
				<AddUrlForm sessionId={sessionIdNum} onArticleAdded={handleArticleAdded} />
				<FileUploadDropzone sessionId={sessionIdNum} onArticleAdded={handleArticleAdded} />
			</div>
		</section>

		<section class="articles-section">
			<h2>Articles</h2>
			<ArticleList
				bind:this={articleListRef}
				sessionId={sessionIdNum}
				onArticleDeleted={handleArticleAdded}
			/>
		</section>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.breadcrumb {
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	.breadcrumb a {
		color: #1976d2;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.breadcrumb span {
		margin: 0 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.error {
		text-align: center;
		padding: 2rem;
		background: #ffebee;
		border-radius: 8px;
		color: #c62828;
	}

	.error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #d32f2f;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.session-header {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.header-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.header-info h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #333;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-draft {
		background: #f0f0f0;
		color: #666;
	}
	.status-active {
		background: #e3f2fd;
		color: #1976d2;
	}
	.status-completed {
		background: #e8f5e9;
		color: #388e3c;
	}
	.status-archived {
		background: #fafafa;
		color: #9e9e9e;
	}

	.description {
		color: #666;
		margin: 0 0 1rem 0;
		line-height: 1.6;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		font-size: 0.9rem;
		color: #888;
	}

	.status-actions {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.status-actions h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
	}

	.action-buttons button {
		padding: 0.625rem 1.25rem;
		background: #1976d2;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.action-buttons button:hover {
		background: #1565c0;
	}

	.action-buttons .btn-archive {
		background: #ff9800;
	}

	.action-buttons .btn-archive:hover {
		background: #f57c00;
	}

	.add-article-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.add-article-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.add-forms {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}

	.articles-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.articles-section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
	}
</style>
