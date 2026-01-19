<script lang="ts">
	import type { SessionResponse } from '$lib/api/types';

	interface Props {
		isOpen: boolean;
		session: SessionResponse | null;
		onClose: () => void;
		onConfirm: () => Promise<void>;
	}

	let { isOpen, session, onClose, onConfirm }: Props = $props();

	let isDeleting = $state(false);
	let error = $state<string | null>(null);

	async function handleDelete() {
		isDeleting = true;
		error = null;

		try {
			await onConfirm();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete session';
		} finally {
			isDeleting = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen && session}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="modal-content">
			<header class="modal-header">
				<h2>Delete Session</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close modal"> &times; </button>
			</header>

			<div class="modal-body">
				{#if error}
					<div class="error-message" role="alert">{error}</div>
				{/if}

				<p class="warning-text">
					Are you sure you want to delete <strong>"{session.name}"</strong>?
				</p>
				<p class="info-text">
					This action will soft-delete the session. The session can be recovered by an
					administrator.
				</p>
			</div>

			<footer class="modal-footer">
				<button class="btn-cancel" onclick={onClose} disabled={isDeleting}>Cancel</button>
				<button class="btn-delete" onclick={handleDelete} disabled={isDeleting}>
					{#if isDeleting}
						Deleting...
					{:else}
						Delete Session
					{/if}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
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
		max-width: 450px;
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
		color: #d32f2f;
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

	.modal-body {
		padding: 1.5rem;
	}

	.error-message {
		background: #ffebee;
		color: #c62828;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.warning-text {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: #333;
	}

	.info-text {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.btn-cancel,
	.btn-delete {
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

	.btn-cancel:hover:not(:disabled) {
		background: #f5f5f5;
	}

	.btn-delete {
		background: #d32f2f;
		border: 1px solid #d32f2f;
		color: white;
	}

	.btn-delete:hover:not(:disabled) {
		background: #c62828;
	}

	.btn-cancel:disabled,
	.btn-delete:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
