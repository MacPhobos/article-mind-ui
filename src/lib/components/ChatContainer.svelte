<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChatMessageResponse } from '$lib/api/types';
	import { getChatHistory, sendMessage, clearChatHistory } from '$lib/api/chat';
	import MessageBubble from './MessageBubble.svelte';
	import ChatInput from './ChatInput.svelte';

	// Props
	interface Props {
		sessionId: number;
	}
	let { sessionId }: Props = $props();

	// State
	let messages = $state<ChatMessageResponse[]>([]);
	let isLoading = $state(false);
	let isSending = $state(false);
	let error = $state<string | null>(null);
	let messagesContainer: HTMLDivElement | null = $state(null);
	let highlightedCitation = $state<number | null>(null);

	// Load chat history on mount
	onMount(async () => {
		await loadHistory();
	});

	/**
	 * Load chat history from API
	 */
	async function loadHistory() {
		isLoading = true;
		error = null;
		try {
			const response = await getChatHistory(sessionId);
			messages = response.messages;
			scrollToBottom();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load chat history';
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Send a new message
	 */
	async function handleSendMessage(content: string) {
		if (!content.trim() || isSending) return;

		isSending = true;
		error = null;

		// Optimistically add user message
		const userMessage: ChatMessageResponse = {
			id: Date.now(), // Temporary ID
			role: 'user',
			content: content.trim(),
			sources: null,
			created_at: new Date().toISOString()
		};
		messages = [...messages, userMessage];
		scrollToBottom();

		try {
			const response = await sendMessage(sessionId, content);

			// Replace user message with server version and add assistant response
			// Note: We keep the optimistic user message for better UX
			const assistantMessage: ChatMessageResponse = {
				id: response.message_id,
				role: 'assistant',
				content: response.content,
				sources: response.sources,
				created_at: response.created_at
			};
			messages = [...messages, assistantMessage];
			scrollToBottom();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send message';
			// Remove optimistic user message on error
			messages = messages.slice(0, -1);
		} finally {
			isSending = false;
		}
	}

	/**
	 * Clear all chat history
	 */
	async function handleClearHistory() {
		if (!confirm('Clear all chat history for this session?')) return;

		try {
			await clearChatHistory(sessionId);
			messages = [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to clear history';
		}
	}

	/**
	 * Scroll to bottom of messages
	 */
	function scrollToBottom() {
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 100);
	}

	/**
	 * Handle citation click - highlight the source and auto-clear after 2s
	 */
	function handleCitationClick(citationIndex: number) {
		highlightedCitation = citationIndex;

		// Clear highlight after 2 seconds
		setTimeout(() => {
			highlightedCitation = null;
		}, 2000);
	}
</script>

<div class="chat-container">
	<div class="chat-header">
		<h3>Knowledge Q&A</h3>
		{#if messages.length > 0}
			<button class="clear-btn" onclick={handleClearHistory}>Clear History</button>
		{/if}
	</div>

	{#if error}
		<div class="error-banner">
			{error}
			<button onclick={() => (error = null)}>Dismiss</button>
		</div>
	{/if}

	<div class="messages" bind:this={messagesContainer}>
		{#if isLoading}
			<div class="loading">Loading chat history...</div>
		{:else if messages.length === 0}
			<div class="empty-state">
				<p>Ask questions about your saved articles.</p>
				<p class="hint">The AI will answer based on your content with citations.</p>
			</div>
		{:else}
			{#each messages as message (message.id)}
				<MessageBubble
					role={message.role}
					content={message.content}
					sources={message.sources}
					timestamp={message.created_at}
					onCitationClick={handleCitationClick}
					{highlightedCitation}
				/>
			{/each}
		{/if}

		{#if isSending}
			<div class="typing-indicator">
				<span></span><span></span><span></span>
			</div>
		{/if}
	</div>

	<ChatInput
		onSend={handleSendMessage}
		disabled={isSending || isLoading}
		placeholder={isSending ? 'Generating response...' : 'Ask a question...'}
	/>
</div>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 400px;
		max-height: 80vh;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
	}

	.chat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.clear-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		color: #6b7280;
		background: transparent;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
	}

	.clear-btn:hover {
		background: #f3f4f6;
	}

	.error-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #fef2f2;
		color: #dc2626;
		font-size: 0.875rem;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.loading,
	.empty-state {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
	}

	.empty-state .hint {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-top: 0.5rem;
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
		padding: 1rem;
		align-self: flex-start;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: #d1d5db;
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out;
	}

	.typing-indicator span:nth-child(1) {
		animation-delay: 0s;
	}
	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}
	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-6px);
		}
	}
</style>
