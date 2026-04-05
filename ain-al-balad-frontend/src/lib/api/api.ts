import axios from "axios";

// ✅ إصلاح: baseUrl ديناميكي بدل hardcoded localhost
const getApiEndPoint = (): string => {
  if (typeof window !== "undefined") {
    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocalDev) {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
};

export const baseUrl = getApiEndPoint();

export const authInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
});

const apiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
});

apiInstance.interceptors.request.use(
  (config: any) => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const { token } = JSON.parse(user);
        if (token) {
          config.headers = config.headers || {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      } catch {
        localStorage.removeItem("user");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ auto-logout إذا انتهى الـ token
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
