import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
	token: string | null;
	phone: string;
	isInitializing: boolean;
	setPhone: (value: string) => void;
	login: (nextToken: string, nextPhone: string) => Promise<void>;
	logout: () => Promise<void>;
};

const USER_TOKEN_KEY = 'proofpass:user:token';
const USER_PHONE_KEY = 'proofpass:user:phone';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [phone, setPhone] = useState('');
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		async function restoreSession() {
			try {
				const [savedToken, savedPhone] = await Promise.all([
					AsyncStorage.getItem(USER_TOKEN_KEY),
					AsyncStorage.getItem(USER_PHONE_KEY),
				]);

				if (savedToken) {
					setToken(savedToken);
				}
				if (savedPhone) {
					setPhone(savedPhone);
				}
			} finally {
				setIsInitializing(false);
			}
		}

		restoreSession();
	}, []);

	const login = useCallback(async (nextToken: string, nextPhone: string) => {
		setToken(nextToken);
		setPhone(nextPhone);
		await Promise.all([
			AsyncStorage.setItem(USER_TOKEN_KEY, nextToken),
			AsyncStorage.setItem(USER_PHONE_KEY, nextPhone),
		]);
	}, []);

	const logout = useCallback(async () => {
		setToken(null);
		setPhone('');
		await Promise.all([
			AsyncStorage.removeItem(USER_TOKEN_KEY),
			AsyncStorage.removeItem(USER_PHONE_KEY),
		]);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			phone,
			isInitializing,
			setPhone,
			login,
			logout,
		}),
		[token, phone, isInitializing, login, logout]
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
