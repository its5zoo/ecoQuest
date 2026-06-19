import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPosts, createPost } from './socialService';
import apiRequest from './apiClient';
import useAuthStore from '../store/authStore';

vi.mock('./apiClient', () => ({
  default: vi.fn(),
}));

describe('socialService', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    useAuthStore.setState({ token: null, isAuthenticated: false });
  });

  it('requires authentication before fetching posts', async () => {
    await expect(fetchPosts('India')).rejects.toThrow('Not authenticated');
  });

  it('builds state-scoped post queries through apiRequest', async () => {
    useAuthStore.setState({
      token: 'header.payload.signature',
      isAuthenticated: true,
    });
    apiRequest.mockResolvedValue({ posts: [] });

    await fetchPosts('State', null, 'Maharashtra');

    expect(apiRequest.mock.calls[0][0]).toContain('scope=State');
    expect(apiRequest.mock.calls[0][0]).toContain('state=Maharashtra');
  });

  it('builds scoped post queries through apiRequest', async () => {
    useAuthStore.setState({
      token: 'header.payload.signature',
      isAuthenticated: true,
    });
    apiRequest.mockResolvedValue({ posts: [{ id: '1' }] });

    const posts = await fetchPosts('District', 'Pune', 'Maharashtra');

    expect(posts).toEqual([{ id: '1' }]);
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining('scope=District'),
      expect.objectContaining({ token: 'header.payload.signature' })
    );
    expect(apiRequest.mock.calls[0][0]).toContain('district=Pune');
  });

  it('returns moderation failures without throwing', async () => {
    useAuthStore.setState({
      token: 'header.payload.signature',
      isAuthenticated: true,
    });
    apiRequest.mockRejectedValue({
      message: 'Content blocked',
      data: { isModerationFailure: true },
    });

    await expect(createPost('bad content', 'India')).resolves.toEqual({
      success: false,
      isModerationFailure: true,
      message: 'Content blocked',
    });
  });

  it('returns a default failure message when moderation errors omit text', async () => {
    useAuthStore.setState({
      token: 'header.payload.signature',
      isAuthenticated: true,
    });
    apiRequest.mockRejectedValue({ data: { isModerationFailure: true } });

    await expect(createPost('bad content', 'India')).resolves.toEqual({
      success: false,
      isModerationFailure: true,
      message: 'Failed to create post',
    });
  });

  it('returns created posts on success', async () => {
    useAuthStore.setState({
      token: 'header.payload.signature',
      isAuthenticated: true,
    });
    apiRequest.mockResolvedValue({ post: { id: '42' } });

    await expect(createPost('hello world', 'India')).resolves.toEqual({
      success: true,
      post: { id: '42' },
    });
  });
});
