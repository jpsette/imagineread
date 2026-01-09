# Imagine Read - Mobile App

This is the mobile client for Imagine Read, built with **React Native**, **Expo**, **TypeScript**, **Expo Router**, and **NativeWind (Tailwind CSS)**.

## Getting Started

1.  Navigate to the mobile app directory:
    ```bash
    cd mobile_app
    ```

2.  Install dependencies (if not already installed):
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```
    - Press `a` for Android emulator.
    - Press `i` for iOS simulator.
    - Scan the QR code with Expo Go.

## Project Structure

- **`src/app`**: File-based routing (managed by Expo Router).
  - `_layout.tsx`: Root layout configuration.
  - `index.tsx`: Home screen.
- **`src/components`**: Reusable UI components.
- **`src/hooks`**: Custom React hooks.
- **`src/services`**: API services and logic.
- **`src/constants`**: Application constants.
- **`global.css`**: Tailwind CSS directives.

## Styling

We use **NativeWind v4** for styling, which allows you to use Tailwind CSS classes directly in your components.

```tsx
<View className="bg-white p-4">
  <Text className="text-lg font-bold">Hello</Text>
</View>
```

## Path Aliases

- `@/*` -> `./src/*`

Example: `import Button from "@/components/Button";`
