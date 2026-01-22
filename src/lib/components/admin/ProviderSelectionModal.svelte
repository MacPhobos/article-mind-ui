<script lang="ts">
	import {
		getProviderConfig,
		updateEmbeddingProvider,
		updateLlmProvider,
		type ProviderConfig
	} from '$lib/api/admin';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	// State
	let config = $state<ProviderConfig | null>(null);
	let selectedEmbedding = $state<'openai' | 'ollama'>('openai');
	let selectedLlm = $state<'openai' | 'anthropic'>('openai');
	let isLoading = $state(false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let warning = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Track if embedding provider changed (requires reindex)
	let embeddingChanged = $derived(config && selectedEmbedding !== config.embedding_provider);
	let llmChanged = $derived(config && selectedLlm !== config.llm_provider);
	let hasChanges = $derived(embeddingChanged || llmChanged);

	// Load config when modal opens
	$effect(() => {
		if (isOpen) {
			loadConfig();
		} else {
			// Reset state when modal closes
			error = null;
			warning = null;
			successMessage = null;
		}
	});

	async function loadConfig() {
		isLoading = true;
		error = null;

		try {
			config = await getProviderConfig();
			selectedEmbedding = config.embedding_provider;
			selectedLlm = config.llm_provider;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load provider configuration';
			console.error('Failed to load provider config:', err);
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		if (!config) return;

		isSaving = true;
		error = null;
		warning = null;
		successMessage = null;

		try {
			// Update LLM provider if changed
			if (llmChanged) {
				await updateLlmProvider(selectedLlm);
			}

			// Update embedding provider if changed
			if (embeddingChanged) {
				// Pass confirm_reindex=true to acknowledge reindex requirement
				const result = await updateEmbeddingProvider(selectedEmbedding, true);

				if (result.warning) {
					warning = result.warning;
				}

				if (result.reindex_triggered) {
					successMessage =
						'Provider configuration updated. Reindexing has been triggered automatically.';
				} else {
					successMessage = 'Provider configuration updated successfully.';
				}
			} else {
				successMessage = 'Provider configuration updated successfully.';
			}

			// Reload config to reflect changes
			await loadConfig();

			// Auto-close after 2 seconds on success
			if (!warning) {
				setTimeout(() => {
					onClose();
				}, 2000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update provider configuration';
			console.error('Failed to update providers:', err);
		} finally {
			isSaving = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isSaving) {
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
				<h2>Configure Providers</h2>
				{#if !isSaving}
					<button class="close-btn" onclick={onClose} aria-label="Close modal"> &times; </button>
				{/if}
			</header>

			<div class="modal-body">
				{#if isLoading}
					<p class="loading-message">Loading configuration...</p>
				{:else if error}
					<div class="error-box">
						<strong>Error:</strong>
						{error}
					</div>
				{:else if config}
					<div class="form-section">
						<label for="llm-provider" class="form-label">
							<strong>LLM Provider</strong>
							<span class="label-description">Used for text generation and analysis</span>
						</label>
						<select
							id="llm-provider"
							bind:value={selectedLlm}
							disabled={isSaving}
							class="form-select"
						>
							{#each config.llm_provider_available as provider (provider)}
								<option value={provider}>{provider}</option>
							{/each}
						</select>
					</div>

					<div class="form-section">
						<label for="embedding-provider" class="form-label">
							<strong>Embedding Provider</strong>
							<span class="label-description">
								Used for semantic search and vector embeddings
							</span>
						</label>
						<select
							id="embedding-provider"
							bind:value={selectedEmbedding}
							disabled={isSaving}
							class="form-select"
						>
							{#each config.embedding_provider_available as provider (provider)}
								<option value={provider}>{provider}</option>
							{/each}
						</select>

						{#if embeddingChanged}
							<div class="warning-box">
								<strong>Warning:</strong> Changing the embedding provider requires reindexing all articles.
								This process will start automatically when you save.
							</div>
						{/if}
					</div>

					{#if warning}
						<div class="warning-box">
							<strong>Warning:</strong>
							{warning}
						</div>
					{/if}

					{#if successMessage}
						<div class="success-box">
							<strong>Success!</strong>
							{successMessage}
						</div>
					{/if}
				{/if}
			</div>

			<footer class="modal-footer">
				{#if !isLoading && !successMessage}
					<button class="btn-cancel" onclick={onClose} disabled={isSaving}> Cancel </button>
					<button class="btn-submit" onclick={handleSave} disabled={!hasChanges || isSaving}>
						{#if isSaving}
							Saving...
						{:else if embeddingChanged}
							Save and Reindex
						{:else}
							Save
						{/if}
					</button>
				{:else if successMessage}
					<button class="btn-submit" onclick={onClose}> Close </button>
				{/if}
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Modal Styles */
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

	.modal-body {
		padding: 1.5rem;
	}

	.loading-message {
		text-align: center;
		color: #666;
		padding: 1rem 0;
	}

	/* Form Styles */
	.form-section {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		margin-bottom: 0.5rem;
	}

	.form-label strong {
		display: block;
		color: #333;
		font-size: 0.95rem;
		margin-bottom: 0.25rem;
	}

	.label-description {
		display: block;
		color: #666;
		font-size: 0.85rem;
		font-weight: normal;
	}

	.form-select {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.form-select:hover:not(:disabled) {
		border-color: #1976d2;
	}

	.form-select:focus {
		outline: none;
		border-color: #1976d2;
		box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
	}

	.form-select:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Message Boxes */
	.warning-box {
		background: #fff3e0;
		border: 1px solid #ffb74d;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #f57c00;
		font-size: 0.875rem;
		margin-top: 1rem;
		line-height: 1.5;
	}

	.success-box {
		background: #e8f5e9;
		border: 1px solid #81c784;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #388e3c;
		font-size: 0.875rem;
		margin-top: 1rem;
		line-height: 1.5;
	}

	.error-box {
		background: #ffebee;
		border: 1px solid #ef5350;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		color: #d32f2f;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* Footer Styles */
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e0e0e0;
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
