<script lang="ts">
	import { uploadArticleFile } from '$lib/api/articles';

	interface Props {
		sessionId: number;
		onArticleAdded?: () => void;
	}
	let { sessionId, onArticleAdded }: Props = $props();

	// State
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isDragging = $state(false);

	const allowedTypes = [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/msword',
		'text/plain',
		'text/markdown',
		'text/html'
	];

	const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.html', '.htm'];

	function isValidFile(file: File): boolean {
		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		return allowedExtensions.includes(extension) || allowedTypes.includes(file.type);
	}

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;

		const file = files[0];

		if (!isValidFile(file)) {
			error = `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`;
			return;
		}

		try {
			loading = true;
			error = null;

			await uploadArticleFile(sessionId, file);
			onArticleAdded?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			loading = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		handleFiles(event.dataTransfer?.files ?? null);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		handleFiles(input.files);
		input.value = ''; // Reset input
	}
</script>

<div
	class="dropzone"
	class:dragging={isDragging}
	class:loading
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	role="region"
	aria-label="File upload dropzone"
>
	{#if loading}
		<div class="loading-content">
			<span class="spinner"></span>
			<p>Uploading...</p>
		</div>
	{:else}
		<div class="dropzone-content">
			<svg
				class="upload-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
			<p>Drag and drop a file here, or</p>
			<label class="file-input-label">
				<span>Browse files</span>
				<input
					type="file"
					accept={allowedExtensions.join(',')}
					onchange={handleFileInput}
					class="visually-hidden"
				/>
			</label>
			<p class="hint">Supported: PDF, DOCX, DOC, TXT, MD, HTML (Max 50MB)</p>
		</div>
	{/if}

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.dropzone {
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s;
		background: #fafafa;
	}

	.dropzone.dragging {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.dropzone.loading {
		opacity: 0.7;
		pointer-events: none;
	}

	.dropzone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.upload-icon {
		width: 48px;
		height: 48px;
		color: #9ca3af;
	}

	.dropzone-content p {
		margin: 0;
		color: #6b7280;
	}

	.file-input-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		margin-top: 0.5rem;
	}

	.file-input-label:hover {
		background: #2563eb;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.hint {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-top: 0.5rem;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 4px;
		font-size: 0.875rem;
	}
</style>
