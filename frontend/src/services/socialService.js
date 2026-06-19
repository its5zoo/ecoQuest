import apiRequest from './apiClient';
import useAuthStore from '../store/authStore';

function requireAuthToken() {
  const token = useAuthStore.getState().getToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export const fetchPosts = async (scope, district, state) => {
  const token = requireAuthToken();

  let path = `/community/posts?scope=${encodeURIComponent(scope)}`;
  if (scope === 'District' && district) {
    path += `&district=${encodeURIComponent(district)}`;
  } else if (scope === 'State' && state) {
    path += `&state=${encodeURIComponent(state)}`;
  }

  const data = await apiRequest(path, { token });
  return data.posts;
};

export const createPost = async (content, scope) => {
  const token = requireAuthToken();

  try {
    const data = await apiRequest('/community/posts', {
      method: 'POST',
      token,
      body: { content, scope },
    });
    return { success: true, post: data.post };
  } catch (err) {
    return {
      success: false,
      isModerationFailure: Boolean(err.data?.isModerationFailure),
      message: err.message || 'Failed to create post',
    };
  }
};
