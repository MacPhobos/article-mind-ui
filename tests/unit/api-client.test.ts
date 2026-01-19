import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '$lib/api/client';

describe('ApiClient', () => {
	let apiClient: ApiClient;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		apiClient = new ApiClient('http://test.com');
		fetchMock = vi.fn();
		// @ts-expect-error - Mocking global fetch in test environment
		globalThis.fetch = fetchMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Error Handling', () => {
		it('should extract error message from FastAPI detail field (string)', async () => {
			const errorResponse = {
				detail: 'Failed to generate response: [openai] OPENAI_API_KEY not configured'
			};

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => errorResponse
			});

			await expect(apiClient.get('/test')).rejects.toThrow(
				'Failed to generate response: [openai] OPENAI_API_KEY not configured'
			);
		});

		it('should extract error message from API contract error.message field', async () => {
			const errorResponse = {
				error: {
					code: 'INTERNAL_ERROR',
					message: 'Database connection failed'
				}
			};

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => errorResponse
			});

			await expect(apiClient.get('/test')).rejects.toThrow('Database connection failed');
		});

		it('should handle FastAPI detail field with object value', async () => {
			const errorResponse = {
				detail: {
					field: 'email',
					error: 'Invalid email format'
				}
			};

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: async () => errorResponse
			});

			await expect(apiClient.get('/test')).rejects.toThrow(
				'{"field":"email","error":"Invalid email format"}'
			);
		});

		it('should fallback to status text if JSON parsing fails', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => {
					throw new Error('Invalid JSON');
				}
			});

			await expect(apiClient.get('/test')).rejects.toThrow('Internal Server Error');
		});

		it('should use generic message if response has unexpected format', async () => {
			const errorResponse = {
				unknownField: 'unknown value'
			};

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => errorResponse
			});

			await expect(apiClient.get('/test')).rejects.toThrow('API request failed');
		});

		it('should fallback to generic message if statusText is empty', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: '',
				json: async () => {
					throw new Error('Invalid JSON');
				}
			});

			await expect(apiClient.get('/test')).rejects.toThrow('API request failed');
		});

		it('should log errors to console', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ detail: 'Test error' })
			});

			await expect(apiClient.get('/test')).rejects.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'API request failed:',
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe('Successful Requests', () => {
		it('should return parsed JSON on successful request', async () => {
			const responseData = { id: 1, name: 'Test' };

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => responseData
			});

			const result = await apiClient.get('/test');

			expect(result).toEqual(responseData);
		});

		it('should include Content-Type header', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({})
			});

			await apiClient.get('/test');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);
		});

		it('should merge custom headers with default headers', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({})
			});

			await apiClient.fetch('/test', {
				headers: {
					Authorization: 'Bearer token'
				}
			});

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer token'
					})
				})
			);
		});
	});

	describe('HTTP Methods', () => {
		beforeEach(() => {
			fetchMock.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({})
			});
		});

		it('should make GET request', async () => {
			await apiClient.get('/test');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					method: 'GET'
				})
			);
		});

		it('should make POST request with body', async () => {
			const data = { name: 'Test' };

			await apiClient.post('/test', data);

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(data)
				})
			);
		});

		it('should make PATCH request with body', async () => {
			const data = { name: 'Updated' };

			await apiClient.patch('/test', data);

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify(data)
				})
			);
		});

		it('should make DELETE request', async () => {
			await apiClient.delete('/test');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test.com/test',
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});
	});
});
