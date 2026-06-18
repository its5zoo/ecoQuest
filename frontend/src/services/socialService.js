import useAuthStore from '../store/authStore';

const BACKEND = import.meta.env.VITE_API_URL || 'https://carbonfootprint-production-636f.up.railway.app/api';

export const fetchPosts = async (scope, district, state) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  let url = `${BACKEND}/community/posts?scope=${scope}`;
  if (scope === 'District' && district) {
    url += `&district=${encodeURIComponent(district)}`;
  } else if (scope === 'State' && state) {
    url += `&state=${encodeURIComponent(state)}`;
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch posts');
  }

  const data = await res.json();
  return data.posts;
};

export const createPost = async (content, scope) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BACKEND}/community/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, scope })
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      isModerationFailure: !!data.isModerationFailure,
      message: data.message || 'Failed to create post'
    };
  }

  return { success: true, post: data.post };
};
