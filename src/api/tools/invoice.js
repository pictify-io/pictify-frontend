import { PUBLIC_BACKEND_URL } from '$env/static/public';


const getTemplates = async () => {
  const apiUrl = new URL(`${PUBLIC_BACKEND_URL}/api/tools/templates/invoice/all`);
  const response = await fetch(apiUrl);
  return response.json();
}

const getTemplate = async (templateName) => {
  const apiUrl = new URL(`${PUBLIC_BACKEND_URL}/api/tools/templates/invoice/${templateName}`);
  const response = await fetch(apiUrl);
  return response.text();
}

export { getTemplates, getTemplate };