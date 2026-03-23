// Simple authentication utilities
export interface User {
    username: string;
    id: string;
}

export const isAuthenticated = (): boolean => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        return !!token;
    }
    return false;
};

export const getUser = (): User | null => {
    if (typeof window !== "undefined") {
        const userJson = localStorage.getItem("user");
        return userJson ? JSON.parse(userJson) : null;
    }
    return null;
};

export const login = (username: string, password: string): boolean => {
    // Simple validation - in production, validate against a real backend
    if (username && password) {
        const user: User = {
            username,
            id: Math.random().toString(36).substr(2, 9),
        };
        const token = "token_" + Date.now();
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        // Set cookie for middleware authentication
        if (typeof window !== "undefined") {
            document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Strict`;
        }
        return true;
    }
    return false;
};

export const logout = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        // Remove cookie for middleware
        document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";
    }
};
