import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { EventItem, getEvents } from '@/lib/api';

export default function EventsScreen() {
	const { token, logout } = useAuth();
	const router = useRouter();
	const [events, setEvents] = useState<EventItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchEvents = useCallback(async () => {
		try {
			setError(null);
			const data = await getEvents();
			setEvents(data);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	if (!token) {
		return <Redirect href="/login" />;
	}

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<Text style={styles.title}>Events</Text>
				<Pressable onPress={logout}>
					<Text style={styles.logout}>Logout</Text>
				</Pressable>
			</View>

			{loading ? <ActivityIndicator style={styles.loader} /> : null}
			{error ? <Text style={styles.error}>{error}</Text> : null}

			<FlatList
				data={events}
				keyExtractor={(item) => String(item.eventId)}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
					setRefreshing(true);
					fetchEvents();
				}} />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<Text style={styles.name}>{item.name}</Text>
						<Text style={styles.meta}>{item.location}</Text>
						<Text style={styles.meta}>{new Date(item.date * 1000).toLocaleString()}</Text>
						<Text style={styles.price}>INR {item.price}</Text>
						<Pressable
							style={styles.button}
							onPress={() => router.push(`/book/${item.eventId}`)}>
							<Text style={styles.buttonText}>Book Now</Text>
						</Pressable>
					</View>
				)}
				ListEmptyComponent={!loading ? <Text style={styles.empty}>No events available.</Text> : null}
				contentContainerStyle={{ paddingBottom: 24 }}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: '#f8fafc',
		padding: 12,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#0f172a',
	},
	logout: {
		color: '#b91c1c',
		fontWeight: '700',
	},
	loader: {
		marginTop: 20,
	},
	error: {
		color: '#b91c1c',
		marginBottom: 8,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#e2e8f0',
	},
	name: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0f172a',
	},
	meta: {
		color: '#475569',
		marginTop: 4,
	},
	price: {
		marginTop: 8,
		color: '#0369a1',
		fontWeight: '700',
	},
	button: {
		marginTop: 10,
		backgroundColor: '#0ea5e9',
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: 'center',
	},
	buttonText: {
		color: '#082f49',
		fontWeight: '700',
	},
	empty: {
		color: '#475569',
		marginTop: 20,
		textAlign: 'center',
	},
});
