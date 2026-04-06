import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  withCredentials: true, // sends httpOnly cookies with every request
  headers: { "Content-Type": "application/json" },
});

// Redirect to login on 401 (token expired or not logged in)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 && !error.config.url.includes("/auth/login")) {
      // Try token refresh first
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/auth/refresh`,
          null,
          { withCredentials: true },
        );
        // Retry original request
        return api(error.config);
      } catch {
        // Refresh failed — go to login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);
