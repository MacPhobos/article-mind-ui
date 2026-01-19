<script lang="ts">
	// Props
	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
	}
	let { onSend, disabled = false, placeholder = 'Type a message...' }: Props = $props();

	// State
	let inputValue = $state('');
	let textareaRef: HTMLTextAreaElement | null = $state(null);

	/**
	 * Handle form submission
	 */
	function handleSubmit(e: Event) {
		e.preventDefault();
		if (inputValue.trim() && !disabled) {
			onSend(inputValue);
			inputValue = '';
			resizeTextarea();
		}
	}

	/**
	 * Handle keyboard shortcuts
	 */
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}

	/**
	 * Auto-resize textarea based on content
	 */
	function resizeTextarea() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = Math.min(textareaRef.scrollHeight, 150) + 'px';
		}
	}
</script>

<form class="chat-input" onsubmit={handleSubmit}>
	<textarea
		bind:this={textareaRef}
		bind:value={inputValue}
		oninput={resizeTextarea}
		onkeydown={handleKeyDown}
		{placeholder}
		{disabled}
		rows="1"
	></textarea>

	<button type="submit" {disabled} aria-label="Send message">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M22 2L11 13" />
			<path d="M22 2L15 22L11 13L2 9L22 2Z" />
		</svg>
	</button>
</form>

<style>
	.chat-input {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		background: white;
	}

	textarea {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 20px;
		resize: none;
		font-family: inherit;
		font-size: 0.9375rem;
		line-height: 1.5;
		max-height: 150px;
		overflow-y: auto;
	}

	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	textarea:disabled {
		background: #f9fafb;
		color: #9ca3af;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #2563eb;
	}

	button:disabled {
		background: #d1d5db;
		cursor: not-allowed;
	}
</style>
