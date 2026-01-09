import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../modules/auth/store/useAuthStore';
import { Lock, Mail, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await login(email, password);
            // Navigation is handled by the caller or observer, but explicit replace is good too
            router.replace('/(tabs)');
        } catch (e) {
            Alert.alert('Login Failed', 'Invalid credentials');
        }
    };

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1 justify-center px-8">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                    <View className="items-center mb-12">
                        <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-900">
                            <Lock color="white" size={32} />
                        </View>
                        <Text className="text-white text-3xl font-bold tracking-tight">Welcome Back</Text>
                        <Text className="text-zinc-500 mt-2 text-base">Sign in to sync your library</Text>
                    </View>

                    <View className="space-y-4">
                        <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-4 border border-zinc-800">
                            <Mail color="#71717a" size={20} />
                            <TextInput
                                className="flex-1 text-white ml-3 text-base"
                                placeholder="Email"
                                placeholderTextColor="#71717a"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-4 border border-zinc-800">
                            <Lock color="#71717a" size={20} />
                            <TextInput
                                className="flex-1 text-white ml-3 text-base"
                                placeholder="Password"
                                placeholderTextColor="#71717a"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className="mt-8 bg-white py-4 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.8}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <>
                                <Text className="text-black font-bold text-lg mr-2">Sign In</Text>
                                <ArrowRight color="black" size={20} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity className="mt-6 items-center">
                        <Text className="text-zinc-500 text-sm">Forgot Password?</Text>
                    </TouchableOpacity>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
