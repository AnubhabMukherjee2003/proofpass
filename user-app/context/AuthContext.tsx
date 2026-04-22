import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthContextValue = {
	token: string | null;
	phone: string;
	setPhone: (value: string) => void;
	login: (nextToken: string, nextPhone: string) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [phone, setPhone] = useState('');

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			phone,
			setPhone,
			login: (nextToken: string, nextPhone: string) => {
				setToken(nextToken);
				setPhone(nextPhone);
			},
			logout: () => {
				setToken(null);
				setPhone('');
			},
		}),
		[token, phone]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used inside AuthProvider');
	}
	return ctx;
}
