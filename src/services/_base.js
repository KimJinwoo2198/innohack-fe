import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ??
  "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  withCredentials: true,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function buildApiPath(path = "") {
  if (!path) {
    return "/api/";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/api/")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/api${normalized}`;
}

export function baseRequest(config) {
  const nextConfig = { ...config };
  if (typeof nextConfig.url === "string") {
    nextConfig.url = buildApiPath(nextConfig.url);
  }
  return apiClient(nextConfig);
}

export function baseGet(url, config = {}) {
  return baseRequest({
    method: "get",
    url,
    ...config,
  });
}

export function basePost(url, data, config = {}) {
  return baseRequest({
    method: "post",
    url,
    data,
    ...config,
  });
}

export function basePut(url, data, config = {}) {
  return baseRequest({
    method: "put",
    url,
    data,
    ...config,
  });
}

export function basePatch(url, data, config = {}) {
  return baseRequest({
    method: "patch",
    url,
    data,
    ...config,
  });
}

export function baseDelete(url, config = {}) {
  return baseRequest({
    method: "delete",
    url,
    ...config,
  });
}

export default apiClient;

