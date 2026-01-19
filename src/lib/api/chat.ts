/**
 * Chat API client functions
 */

import { apiClient } from './client';
import type { ChatRequest, ChatResponse, ChatHistoryResponse } from './types';

/**
 * Send a chat message and get response
 */
export async function sendMessage(sessionId: number, message: string): Promise<ChatResponse> {
	const request: ChatRequest = { message };
	return apiClient.post<ChatResponse>(`/api/v1/sessions/${sessionId}/chat`, request);
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: number): Promise<ChatHistoryResponse> {
	return apiClient.get<ChatHistoryResponse>(`/api/v1/sessions/${sessionId}/chat/history`);
}

/**
 * Clear chat history for a session
 */
export async function clearChatHistory(sessionId: number): Promise<void> {
	await apiClient.delete(`/api/v1/sessions/${sessionId}/chat/history`);
}
