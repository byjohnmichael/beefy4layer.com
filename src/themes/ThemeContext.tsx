import { createContext, useContext, useState, type ReactNode } from 'react';
import { type CardTheme, tacoBellTheme } from './themes';

interface ThemeContextValue {
    myTheme: CardTheme;
    opponentTheme: CardTheme;
    setMyTheme: (theme: CardTheme) => void;
    setOpponentTheme: (theme: CardTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: CardTheme;
}

export function ThemeProvider({ children, initialTheme = tacoBellTheme }: ThemeProviderProps) {
    const [myTheme, setMyTheme] = useState<CardTheme>(initialTheme);
    // In singleplayer, opponent uses same theme. In multiplayer, this would be set from network.
    const [opponentTheme, setOpponentTheme] = useState<CardTheme>(initialTheme);

    return (
        <ThemeContext.Provider value={{ myTheme, opponentTheme, setMyTheme, setOpponentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Helper hook to get colors for a specific player's cards
export function usePlayerColors(player: 'P1' | 'P2') {
    const { myTheme, opponentTheme } = useTheme();

    if (player === 'P1') {
        // P1 is always "you" - use your theme's primary
        return {
            cardBack: myTheme.primary,
            theme: myTheme,
        };
    } else {
        // P2 is the opponent - use their theme's secondary
        return {
            cardBack: opponentTheme.secondary,
            theme: opponentTheme,
        };
    }
}

// Helper to get suit color based on your theme
export function useSuitColors() {
    const { myTheme } = useTheme();

    return {
        // Clubs and Spades use primary color
        clubsSpades: myTheme.primary.solid,
        // Hearts and Diamonds use secondary color
        heartsDiamonds: myTheme.secondary.solid,
    };
}
