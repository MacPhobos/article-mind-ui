/**
 * Base API client for article-mind-service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiError {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/**
 * FastAPI default error response format
 */
export interface FastAPIError {
	detail: string | Record<string, unknown>;
}

/**
 * Extract error message from various error response formats
 */
function extractErrorMessage(errorData: unknown): string {
	// Handle custom API contract format: { error: { message: "..." } }
	if (
		errorData &&
		typeof errorData === 'object' &&
		'error' in errorData &&
		errorData.error &&
		typeof errorData.error === 'object' &&
		'message' in errorData.error &&
		typeof errorData.error.message === 'string'
	) {
		return errorData.error.message;
	}

	// Handle FastAPI default format: { detail: "..." } or { detail: {...} }
	if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
		const detail = errorData.detail;
		if (typeof detail === 'string') {
			return detail;
		}
		if (typeof detail === 'object' && detail !== null) {
			return JSON.stringify(detail);
		}
	}

	// Fallback for unexpected formats
	return 'API request failed';
}

export class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options?.headers
				}
			});

			if (!response.ok) {
				let errorMessage = 'API request failed';

				try {
					const errorData = await response.json();
					errorMessage = extractErrorMessage(errorData);
				} catch (parseError) {
					// If JSON parsing fails, use status text
					errorMessage = response.statusText || 'API request failed';
				}

				throw new Error(errorMessage);
			}

			return response.json();
		} catch (error) {
			console.error('API request failed:', error);
			throw error;
		}
	}

	async get<T>(endpoint: string): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, data: unknown): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async patch<T>(endpoint: string, data: unknown): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'DELETE' });
	}
}

export const apiClient = new ApiClient();
