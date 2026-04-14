import { useAuthStore } from "@/lib/store";

const DEFAULT_API_URL = "http://localhost:8000/api/v1/admin";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

export const API_ORIGIN = new URL(API_BASE_URL).origin;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getToken() {
  return useAuthStore.getState().token;
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload.message === "string") return payload.message;

  const firstError = Object.values(payload.errors || {})
    .flat()
    .find(Boolean);

  return firstError || fallback;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  const hasBody = options.body !== undefined;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    useAuthStore.getState().clearSession();
    throw new ApiError("Session expirée. Merci de te reconnecter.", 401, payload);
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "Une erreur est survenue côté API."),
      response.status,
      payload
    );
  }

  return payload;
}

function withQuery(path, params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return new URL(path, API_ORIGIN).toString();
}

export function resolveSiteUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!SITE_URL) return null;

  return new URL(path, SITE_URL).toString();
}

export function getPublicArticleUrl(slug) {
  if (!slug) return null;
  return resolveSiteUrl(`/blog/${slug}`);
}

export const api = {
  login: (email, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request("/logout", { method: "POST" }),

  stats: () => request("/stats"),
  statsSources: () => request("/stats/sources"),
  statsDevices: () => request("/stats/devices"),
  statsTimeline: (period = 30) => request(withQuery("/stats/timeline", { period })),

  articles: (params = {}) => request(withQuery("/articles", params)),
  article: (id) => request(`/articles/${id}`),
  createArticle: (data) =>
    request("/articles", { method: "POST", body: JSON.stringify(data) }),
  updateArticle: (id, data) =>
    request(`/articles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteArticle: (id) => request(`/articles/${id}`, { method: "DELETE" }),
  publishArticle: (id) => request(`/articles/${id}/publish`, { method: "POST" }),
  unpublishArticle: (id) =>
    request(`/articles/${id}/unpublish`, { method: "POST" }),
  scheduleArticle: (id, scheduledAt) =>
    request(`/articles/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),

  comments: (params = {}) => request(withQuery("/comments", params)),
  approveComment: (id) => request(`/comments/${id}/approve`, { method: "POST" }),
  spamComment: (id) => request(`/comments/${id}/spam`, { method: "POST" }),
  deleteComment: (id) => request(`/comments/${id}`, { method: "DELETE" }),

  media: (params = {}) => request(withQuery("/media", params)),
  uploadMedia: (formData) => request("/media", { method: "POST", body: formData }),
  deleteMedia: (id) => request(`/media/${id}`, { method: "DELETE" }),

  categories: () => request("/categories"),
  createCategory: (data) =>
    request("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  tags: () => request("/tags"),
  createTag: (data) =>
    request("/tags", { method: "POST", body: JSON.stringify(data) }),
  updateTag: (id, data) =>
    request(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTag: (id) => request(`/tags/${id}`, { method: "DELETE" }),

  series: () => request("/series"),
  createSeries: (data) =>
    request("/series", { method: "POST", body: JSON.stringify(data) }),
  updateSeries: (id, data) =>
    request(`/series/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSeries: (id) => request(`/series/${id}`, { method: "DELETE" }),

  subscribers: (params = {}) => request(withQuery("/subscribers", params)),
  deleteSubscriber: (id) => request(`/subscribers/${id}`, { method: "DELETE" }),
};
