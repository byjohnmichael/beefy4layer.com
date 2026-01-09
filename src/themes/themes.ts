// Theme color definitions
export interface ThemeColor {
  gradient: string;  // For backgrounds with gradients
  solid: string;     // For text, borders, solid fills
  glow: string;      // For shadows and glows
}

export interface CardTheme {
  id: string;
  name: string;
  primary: ThemeColor;    // Clubs/Spades color, P1 card backs, your turn chip
  secondary: ThemeColor;  // Hearts/Diamonds color, P2 card backs, opponent turn chip
  neutral: ThemeColor;    // Deck color
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
  name: 'Taco Bell',
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
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    solid: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
};

// All available themes
export const themes: CardTheme[] = [classicTheme, tacoBellTheme];

// Get theme by ID
export function getThemeById(id: string): CardTheme {
  return themes.find(t => t.id === id) || classicTheme;
}

