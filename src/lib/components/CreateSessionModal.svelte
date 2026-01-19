<script lang="ts">
	import type { SessionResponse, CreateSessionRequest } from '$lib/api/types';

	interface Props {
		isOpen: boolean;
		session?: SessionResponse | null;
		onClose: () => void;
		onSubmit: (data: CreateSessionRequest) => Promise<void>;
	}

	let { isOpen, session = null, onClose, onSubmit }: Props = $props();

	// Form state
	let name = $state(session?.name ?? '');
	let description = $state(session?.description ?? '');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Reset form when modal opens/closes or session changes
	$effect(() => {
		if (isOpen) {
			name = session?.name ?? '';
			description = session?.description ?? '';
			error = null;
		}
	});

	let isEditing = $derived(session !== null);
	let modalTitle = $derived(isEditing ? 'Edit Session' : 'Create New Session');
	let submitLabel = $derived(isEditing ? 'Save Changes' : 'Create Session');

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!name.trim()) {
			error = 'Session name is required';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			await onSubmit({
				name: name.trim(),
				description: description.trim() || undefined
			});
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save session';
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="modal-content">
			<header class="modal-header">
				<h2>{modalTitle}</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close modal"> &times; </button>
			</header>

			<form onsubmit={handleSubmit}>
				{#if error}
					<div class="error-message" role="alert">{error}</div>
				{/if}

				<div class="form-field">
					<label for="session-name">Name *</label>
					<input
						type="text"
						id="session-name"
						bind:value={name}
						placeholder="Enter session name"
						disabled={isSubmitting}
						required
					/>
				</div>

				<div class="form-field">
					<label for="session-description">Description</label>
					<textarea
						id="session-description"
						bind:value={description}
						placeholder="Optional description for this session"
						disabled={isSubmitting}
						rows="3"
					></textarea>
				</div>

				<footer class="modal-footer">
					<button type="button" class="btn-cancel" onclick={onClose} disabled={isSubmitting}>
						Cancel
					</button>
					<button type="submit" class="btn-submit" disabled={isSubmitting}>
						{#if isSubmitting}
							Saving...
						{:else}
							{submitLabel}
						{/if}
					</button>
				</footer>
			</form>
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
		max-width: 500px;
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
		color: #333;
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

	.close-btn:hover {
		color: #333;
	}

	form {
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

	.form-field {
		margin-bottom: 1.25rem;
	}

	.form-field label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.form-field input,
	.form-field textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
	}

	.form-field input:focus,
	.form-field textarea:focus {
		outline: none;
		border-color: #1976d2;
		box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
	}

	.form-field input:disabled,
	.form-field textarea:disabled {
		background: #f5f5f5;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
		margin-top: 0.5rem;
	}

	.btn-cancel,
	.btn-submit {
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

	.btn-submit {
		background: #1976d2;
		border: 1px solid #1976d2;
		color: white;
	}

	.btn-submit:hover:not(:disabled) {
		background: #1565c0;
	}

	.btn-cancel:disabled,
	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
