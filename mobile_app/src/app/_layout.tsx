import "../global.css";
import React from 'react';
import { View } from "react-native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#121212' }}>
                <StatusBar style="light" />
                <Slot />
            </View>
        </GestureHandlerRootView>
    );
}
