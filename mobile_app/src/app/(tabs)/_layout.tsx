import { Tabs } from 'expo-router';
import { Home, Book, Search } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#121212',
                    borderTopWidth: 0,
                },
                tabBarActiveTintColor: '#3B82F6',
                tabBarInactiveTintColor: '#A1A1AA',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: 'Library',
                    tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
