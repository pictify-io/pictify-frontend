
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import backend from '../../service/backend';

const getWebsiteHTML = async (url) => {
  if (!url) {
    return null;
  }
  url = encodeURIComponent(url);
  const response = await backend.get(`/image/page-content?url=${url}`);
  return response;
}

export { getWebsiteHTML };