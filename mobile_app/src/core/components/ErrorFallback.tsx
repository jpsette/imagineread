import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    const handleGoHome = () => {
        resetErrorBoundary();
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <AlertTriangle size={64} color="#EF4444" style={styles.icon} />

                <Text style={styles.title}>Something went wrong</Text>

                <Text style={styles.message}>
                    {error.message || 'An unexpected error occurred. We are working to fix it.'}
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={resetErrorBoundary}>
                        <Text style={styles.primaryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                        <Text style={styles.secondaryButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: '#9CA3AF',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#1F2937',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    secondaryButtonText: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: '600',
    },
});
