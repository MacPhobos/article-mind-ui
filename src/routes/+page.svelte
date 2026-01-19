<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import type { SessionResponse, SessionListResponse, CreateSessionRequest } from '$lib/api/types';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import CreateSessionModal from '$lib/components/CreateSessionModal.svelte';
	import DeleteSessionModal from '$lib/components/DeleteSessionModal.svelte';

	// State
	let sessions = $state<SessionResponse[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Modal state
	let showCreateModal = $state(false);
	let showDeleteModal = $state(false);
	let editingSession = $state<SessionResponse | null>(null);
	let deletingSession = $state<SessionResponse | null>(null);

	// Filter state
	let statusFilter = $state<string>('all');

	// Filtered sessions
	let filteredSessions = $derived(() => {
		if (statusFilter === 'all') {
			return sessions;
		}
		return sessions.filter((s) => s.status === statusFilter);
	});

	// Load sessions on mount
	$effect(() => {
		loadSessions();
	});

	async function loadSessions() {
		isLoading = true;
		error = null;

		try {
			const response = await apiClient.get<SessionListResponse>('/api/v1/sessions');
			sessions = response.sessions;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load sessions';
			console.error('Failed to load sessions:', e);
		} finally {
			isLoading = false;
		}
	}

	async function handleCreateSession(data: CreateSessionRequest) {
		if (editingSession) {
			// Update existing session
			await apiClient.patch(`/api/v1/sessions/${editingSession.id}`, data);
		} else {
			// Create new session
			await apiClient.post('/api/v1/sessions', data);
		}
		await loadSessions();
	}

	async function handleDeleteSession() {
		if (!deletingSession) return;
		await apiClient.delete(`/api/v1/sessions/${deletingSession.id}`);
		await loadSessions();
	}

	async function handleArchiveSession(session: SessionResponse) {
		await apiClient.post(`/api/v1/sessions/${session.id}/status`, {
			status: 'archived'
		});
		await loadSessions();
	}

	function openCreateModal() {
		editingSession = null;
		showCreateModal = true;
	}

	function openEditModal(session: SessionResponse) {
		editingSession = session;
		showCreateModal = true;
	}

	function openDeleteModal(session: SessionResponse) {
		deletingSession = session;
		showDeleteModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
		editingSession = null;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deletingSession = null;
	}
</script>

<div class="page-container">
	<header class="page-header">
		<h1>Research Sessions</h1>
		<button class="btn-create" onclick={openCreateModal}>+ New Session</button>
	</header>

	<div class="filters">
		<label for="status-filter">Filter by status:</label>
		<select id="status-filter" bind:value={statusFilter}>
			<option value="all">All</option>
			<option value="draft">Draft</option>
			<option value="active">Active</option>
			<option value="completed">Completed</option>
			<option value="archived">Archived</option>
		</select>
	</div>

	{#if isLoading}
		<div class="loading">Loading sessions...</div>
	{:else if error}
		<div class="error" role="alert">
			<p>{error}</p>
			<button onclick={loadSessions}>Retry</button>
		</div>
	{:else if filteredSessions().length === 0}
		<div class="empty-state">
			{#if sessions.length === 0}
				<p>No research sessions yet.</p>
				<p>Create your first session to start organizing articles.</p>
				<button class="btn-create" onclick={openCreateModal}>Create Session</button>
			{:else}
				<p>No sessions match the selected filter.</p>
			{/if}
		</div>
	{:else}
		<div class="sessions-grid">
			{#each filteredSessions() as session (session.id)}
				<SessionCard
					{session}
					onEdit={openEditModal}
					onDelete={openDeleteModal}
					onArchive={handleArchiveSession}
				/>
			{/each}
		</div>
	{/if}
</div>

<CreateSessionModal
	isOpen={showCreateModal}
	session={editingSession}
	onClose={closeCreateModal}
	onSubmit={handleCreateSession}
/>

<DeleteSessionModal
	isOpen={showDeleteModal}
	session={deletingSession}
	onClose={closeDeleteModal}
	onConfirm={handleDeleteSession}
/>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
	}

	.btn-create {
		padding: 0.75rem 1.5rem;
		background: #1976d2;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.btn-create:hover {
		background: #1565c0;
	}

	.filters {
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filters label {
		font-size: 0.9rem;
		color: #666;
	}

	.filters select {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
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

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border: 2px dashed #ddd;
		border-radius: 8px;
	}

	.empty-state p {
		margin: 0.5rem 0;
		color: #666;
	}

	.empty-state .btn-create {
		margin-top: 1rem;
	}

	.sessions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}
</style>
