/**
 * Articles API client
 */

import { apiClient } from './client';
import type {
	ArticleResponse,
	ArticleListResponse,
	ArticleContentResponse,
	AddUrlRequest,
	UploadFileResponse
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * List articles in a session
 */
export async function getArticles(sessionId: number): Promise<ArticleListResponse> {
	return apiClient.get<ArticleListResponse>(`/api/v1/sessions/${sessionId}/articles`);
}

/**
 * Get a specific article
 */
export async function getArticle(sessionId: number, articleId: number): Promise<ArticleResponse> {
	return apiClient.get<ArticleResponse>(`/api/v1/sessions/${sessionId}/articles/${articleId}`);
}

/**
 * Add article from URL
 */
export async function addUrlArticle(
	sessionId: number,
	data: AddUrlRequest
): Promise<ArticleResponse> {
	return apiClient.post<ArticleResponse>(`/api/v1/sessions/${sessionId}/articles/url`, data);
}

/**
 * Upload article file
 */
export async function uploadArticleFile(
	sessionId: number,
	file: File
): Promise<UploadFileResponse> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/articles/upload`, {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
		throw new Error(error.detail || 'Upload failed');
	}

	return response.json();
}

/**
 * Delete article (soft delete)
 */
export async function deleteArticle(sessionId: number, articleId: number): Promise<void> {
	return apiClient.delete(`/api/v1/sessions/${sessionId}/articles/${articleId}`);
}

/**
 * Get article extracted content
 */
export async function getArticleContent(
	sessionId: number,
	articleId: number
): Promise<ArticleContentResponse> {
	return apiClient.get<ArticleContentResponse>(
		`/api/v1/sessions/${sessionId}/articles/${articleId}/content`
	);
}
