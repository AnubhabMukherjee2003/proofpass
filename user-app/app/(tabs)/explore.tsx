import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getMyTickets, TicketItem } from '@/lib/api';

function qrUrl(payload: string) {
	return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
}

export default function TicketsScreen() {
	const { token, isInitializing } = useAuth();
	const [tickets, setTickets] = useState<TicketItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function run() {
			if (!token) return;
			try {
				const data = await getMyTickets(token);
				setTickets(data);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		}
		run();
	}, [token]);

	if (isInitializing) {
		return (
			<SafeAreaView style={styles.safe}>
				<ActivityIndicator style={styles.loader} />
			</SafeAreaView>
		);
	}

	if (!token) {
		return <Redirect href="/login" />;
	}

	return (
		<SafeAreaView style={styles.safe}>
			<Text style={styles.title}>My Tickets</Text>

			{loading ? <ActivityIndicator style={styles.loader} /> : null}
			{error ? <Text style={styles.error}>{error}</Text> : null}

			<FlatList
				data={tickets}
				keyExtractor={(item) => String(item.ticketId)}
				renderItem={({ item }) => {
					const payload = JSON.stringify({
						ticketId: item.ticketId,
						token,
					});

					return (
						<View style={styles.card}>
							<Text style={styles.eventName}>{item.event?.name || `Event #${item.eventId}`}</Text>
							<Text style={styles.meta}>Ticket #{item.ticketId}</Text>
							<Text style={styles.meta}>Status: {item.status}</Text>
							<Image source={{ uri: qrUrl(payload) }} style={styles.qr} />
							<Text numberOfLines={1} style={styles.payload}>
								QR Payload: {payload}
							</Text>
						</View>
					);
				}}
				ListEmptyComponent={!loading ? <Text style={styles.empty}>No tickets yet.</Text> : null}
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
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#0f172a',
		marginBottom: 10,
	},
	loader: {
		marginTop: 20,
	},
	error: {
		color: '#b91c1c',
		marginBottom: 10,
	},
	card: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#e2e8f0',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		alignItems: 'center',
	},
	eventName: {
		fontSize: 17,
		fontWeight: '700',
		color: '#0f172a',
		alignSelf: 'flex-start',
	},
	meta: {
		color: '#475569',
		marginTop: 4,
		alignSelf: 'flex-start',
	},
	qr: {
		width: 180,
		height: 180,
		marginTop: 10,
		borderRadius: 10,
		backgroundColor: '#fff',
	},
	payload: {
		marginTop: 8,
		color: '#64748b',
		fontSize: 12,
		alignSelf: 'stretch',
	},
	empty: {
		textAlign: 'center',
		marginTop: 22,
		color: '#475569',
	},
});
