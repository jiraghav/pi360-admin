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

export const login = async (username: string, password: string): Promise<boolean> => {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/cic-clinic/openemr/api";
        const response = await fetch(`${baseUrl}/lawyer_apis/login.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user: username,
                pass: password,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            // Assuming the API returns user data and token
            const user: User = {
                username: data.username || username,
                id: data.id || Math.random().toString(36).substr(2, 9),
            };
            const token = data.token || "token_" + Date.now();
            localStorage.setItem("authToken", token);
            localStorage.setItem("user", JSON.stringify(user));
            // Set cookie for middleware authentication
            if (typeof window !== "undefined") {
                document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Strict`;
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Login error:", error);
        return false;
    }
};

export const logout = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        // Remove cookie for middleware
        document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";
    }
};
