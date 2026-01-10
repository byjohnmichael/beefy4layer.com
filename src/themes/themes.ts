// Theme color definitions
export interface ThemeColor {
    gradient: string; // For backgrounds with gradients
    solid: string; // For text, borders, solid fills
    glow: string; // For shadows and glows
}

export interface CardTheme {
    id: string;
    name: string;
    primary: ThemeColor; // Clubs/Spades color, P1 card backs, your turn chip
    secondary: ThemeColor; // Hearts/Diamonds color, P2 card backs, opponent turn chip
    neutral: ThemeColor; // Deck color
}

// Classic theme - traditional black/red cards
export const classicTheme: CardTheme = {
    id: 'classic',
    name: 'Classic',
    primary: {
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        solid: '#1a1a1a',
        glow: 'rgba(0, 0, 0, 0.5)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        solid: '#dc2626',
        glow: 'rgba(220, 38, 38, 0.5)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)',
        solid: '#2d5a7b',
        glow: 'rgba(45, 90, 123, 0.5)',
    },
};

// Taco Bell theme - purple/gold
export const tacoBellTheme: CardTheme = {
    id: 'taco-bell',
    name: 'Taco',
    primary: {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
        solid: '#7c3aed',
        glow: 'rgba(124, 58, 237, 0.5)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.5)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #ec4899 0%, #fbbf24 100%)', // vibrant pink fading to taco gold
        solid: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.5)', // pink glow
    },
};

// Denver Bronco theme - orange/blue
export const denverBroncoTheme: CardTheme = {
    id: 'denver-bronco',
    name: 'Bronco',
    primary: {
        gradient: 'linear-gradient(135deg, #ff8200 0%, #ffad42 100%)', // bronco orange shades
        solid: '#ff8200', // strong orange
        glow: 'rgba(255, 130, 0, 0.5)', // orange glow
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0a2343 0%, #1560bd 100%)', // navy to blue
        solid: '#1560bd', // strong blue
        glow: 'rgba(21, 96, 189, 0.5)', // blue glow
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #ff8200 0%, #1560bd 100%)', // orange to blue
        solid: '#ff8200',
        glow: 'rgba(255, 130, 0, 0.5)',
    },
};

// Pink & Quartz theme - pink/quartz
export const pinkGoldTheme: CardTheme = {
    id: 'pink-gold',
    name: 'Pink & Gold',
    primary: {
        gradient: 'linear-gradient(135deg, #fb5396 0%, #f37ab2 100%)', // hot pink to soft pink
        solid: '#fb5396', // hot pink
        glow: 'rgba(251, 83, 150, 0.5)', // pink glow
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #e5c16c 0%, #bfa142 100%)', // bright yellow gold to antique gold
        solid: '#e5c16c', // rich, yellow gold (less orange than taco bell gold)
        glow: 'rgba(229, 193, 108, 0.5)', // gold glow
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #706032 0%, #a38a3c 100%)', // deep antique gold/brown to mid gold
        solid: '#706032', // much darker, muddy gold-brown, highly distinct from the above
        glow: 'rgba(112, 96, 50, 0.7)', // dark gold-brown glow
    },
};

// All available themes
export const themes: CardTheme[] = [classicTheme, tacoBellTheme, denverBroncoTheme, pinkGoldTheme];

// Get theme by ID
export function getThemeById(id: string): CardTheme {
    return themes.find((t) => t.id === id) || classicTheme;
}
