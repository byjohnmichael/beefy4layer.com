// Theme color definitions
export interface ThemeColor {
    gradient: string;       // For backgrounds with gradients
    solid: string;          // For text, borders, solid fills
    glow: string;           // For shadows and glows
}

export interface CardTheme {
    id: string;
    name: string;
    group?: string;
    disabled?: boolean;     // If true, theme is hidden from selection UI
    primary: ThemeColor;    // Clubs/Spades color, P1 card backs, your turn chip
    secondary: ThemeColor;  // Hearts/Diamonds color, P2 card backs, opponent turn chip
    neutral: ThemeColor;    // Deck color, neutral chip, usually a gradient between primary and secondary
    darkCardFace?: boolean; // If true, card faces use dark background (for light-colored suit text)
}

// Theme registry - themes auto-register when defined
const themeRegistry: CardTheme[] = [];
function defineTheme(theme: CardTheme): CardTheme {
    themeRegistry.push(theme);
    return theme;
}

// Classic theme - traditional black/red/blue cards
export const classicTheme: CardTheme = defineTheme({
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
});

// Taco theme - purple/gold
export const tacoBellTheme: CardTheme = defineTheme({
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
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #c2418a 52%, #f59e0b 100%)',
        solid: '#c2418a',
        glow: 'rgba(194, 65, 138, 0.55)',
    },
});

// Pink & Quartz theme - pink/gold
export const pinkGoldTheme: CardTheme = defineTheme({
    id: 'pink-gold',
    name: 'Pink & Gold',
    primary: {
        gradient: 'linear-gradient(135deg, #fb5396 0%, #f37ab2 100%)',
        solid: '#fb5396',
        glow: 'rgba(251, 83, 150, 0.5)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #e5c16c 0%, #bfa142 100%)',
        solid: '#e5c16c',
        glow: 'rgba(229, 193, 108, 0.5)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #f472b6 0%, #f4d38a 55%, #c7a24b 100%)',
        solid: '#f4d38a',
        glow: 'rgba(244, 211, 138, 0.65)',
    },
});

// Beach theme - ocean cyan with sandy tan and coral accents (dark card face for visibility)
export const beachTheme: CardTheme = defineTheme({
    id: 'beach',
    name: 'Beach',
    primary: {
        gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        solid: '#0891b2',
        glow: 'rgba(8, 145, 178, 0.5)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #d4a574 0%, #c4956a 100%)',
        solid: '#d4a574',
        glow: 'rgba(212, 165, 116, 0.5)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0891b2 0%, #5ba89a 50%, #d4a574 100%)',
        solid: '#5ba89a',
        glow: 'rgba(91, 168, 154, 0.5)',
    },
    darkCardFace: false,
});

// Arizona Cardinals — cardinal red / black
export const cardinalsTheme: CardTheme = defineTheme({
    id: 'cardinals',
    name: 'Cardinals',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #8b0a14 0%, #c1121f 100%)',
        solid: '#8b0a14',
        glow: 'rgba(193, 18, 31, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #2a2a2e 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #4b0b10 0%, #7b1f2a 52%, #1b1b1f 100%)',
        solid: '#7b1f2a',
        glow: 'rgba(123, 31, 42, 0.55)',
    },
});

// Atlanta Falcons — black / red
export const falconsTheme: CardTheme = defineTheme({
    id: 'falcons',
    name: 'Falcons',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #2a2a2e 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b80f1a 0%, #e11d2e 100%)',
        solid: '#e11d2e',
        glow: 'rgba(225, 29, 46, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #121215 0%, #7c1220 55%, #e11d2e 100%)',
        solid: '#7c1220',
        glow: 'rgba(124, 18, 32, 0.55)',
    },
});

// Baltimore Ravens — purple / black (with a gold bridge)
export const ravensTheme: CardTheme = defineTheme({
    id: 'ravens',
    name: 'Ravens',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #2b0a53 0%, #4c1d95 100%)',
        solid: '#4c1d95',
        glow: 'rgba(76, 29, 149, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #1d0a33 0%, #4c1d95 52%, #c9a227 100%)',
        solid: '#4c1d95',
        glow: 'rgba(201, 162, 39, 0.45)',
    },
});

// Buffalo Bills — royal blue / red
export const billsTheme: CardTheme = defineTheme({
    id: 'bills',
    name: 'Bills',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #1d4ed8 100%)',
        solid: '#1d4ed8',
        glow: 'rgba(29, 78, 216, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b80f1a 0%, #ef4444 100%)',
        solid: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #5b2b6b 52%, #ef4444 100%)',
        solid: '#5b2b6b',
        glow: 'rgba(91, 43, 107, 0.55)',
    },
});

// Carolina Panthers — panther blue / black
export const panthersTheme: CardTheme = defineTheme({
    id: 'panthers',
    name: 'Panthers',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0f2a3a 0%, #0ea5e9 100%)',
        solid: '#0ea5e9',
        glow: 'rgba(14, 165, 233, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #071a24 0%, #0b6fa3 52%, #0b0b0c 100%)',
        solid: '#0b6fa3',
        glow: 'rgba(11, 111, 163, 0.55)',
    },
});

// Chicago Bears — navy / orange
export const bearsTheme: CardTheme = defineTheme({
    id: 'bears',
    name: 'Bears',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b1f3b 0%, #123b7a 100%)',
        solid: '#0b1f3b',
        glow: 'rgba(18, 59, 122, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
        solid: '#fb923c',
        glow: 'rgba(251, 146, 60, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b1f3b 0%, #6b3a3b 52%, #fb923c 100%)',
        solid: '#6b3a3b',
        glow: 'rgba(107, 58, 59, 0.55)',
    },
});

// Cincinnati Bengals — black / orange
export const bengalsTheme: CardTheme = defineTheme({
    id: 'bengals',
    name: 'Bengals',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
        solid: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #101013 0%, #9a4b16 55%, #f59e0b 100%)',
        solid: '#9a4b16',
        glow: 'rgba(154, 75, 22, 0.55)',
    },
});

// Cleveland Browns — deep brown / orange
export const brownsTheme: CardTheme = defineTheme({
    id: 'browns',
    name: 'Browns',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #2b1208 0%, #5a2a10 100%)',
        solid: '#5a2a10',
        glow: 'rgba(90, 42, 16, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
        solid: '#fb923c',
        glow: 'rgba(251, 146, 60, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #2b1208 0%, #8a3d16 52%, #fb923c 100%)',
        solid: '#8a3d16',
        glow: 'rgba(138, 61, 22, 0.55)',
    },
});

// Dallas Cowboys — navy / silver
export const cowboysTheme: CardTheme = defineTheme({
    id: 'cowboys',
    name: 'Cowboys',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)',
        solid: '#0b1f3b',
        glow: 'rgba(30, 58, 138, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #a7b0ba 0%, #e5e7eb 100%)',
        solid: '#a7b0ba',
        glow: 'rgba(167, 176, 186, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b1f3b 0%, #4b5a7a 52%, #cfd6dd 100%)',
        solid: '#4b5a7a',
        glow: 'rgba(75, 90, 122, 0.55)',
    },
});

// Detroit Lions — Honolulu blue / silver
export const lionsTheme: CardTheme = defineTheme({
    id: 'lions',
    name: 'Lions',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0a2a45 0%, #0ea5e9 100%)',
        solid: '#0ea5e9',
        glow: 'rgba(14, 165, 233, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #a7b0ba 0%, #e5e7eb 100%)',
        solid: '#a7b0ba',
        glow: 'rgba(167, 176, 186, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0a2a45 0%, #2f7aa6 52%, #d7dde3 100%)',
        solid: '#2f7aa6',
        glow: 'rgba(47, 122, 166, 0.55)',
    },
});

// Denver Broncos theme - orange/blue
export const broncosTheme: CardTheme = defineTheme({
    id: 'broncos',
    name: 'Broncos',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #ff8200 0%, #ffad42 100%)',
        solid: '#ff8200',
        glow: 'rgba(255, 130, 0, 0.5)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0a2343 0%, #1560bd 100%)',
        solid: '#1560bd',
        glow: 'rgba(21, 96, 189, 0.5)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #ff8200 0%, #6b64d8 50%, #1560bd 100%)',
        solid: '#ff8200',
        glow: 'rgba(255, 130, 0, 0.5)',
    },
});

// Green Bay Packers — green / gold
export const packersTheme: CardTheme = defineTheme({
    id: 'packers',
    name: 'Packers',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b3a2a 0%, #166534 100%)',
        solid: '#166534',
        glow: 'rgba(22, 101, 52, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #caa23a 0%, #fbbf24 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b3a2a 0%, #5b7b3a 52%, #fbbf24 100%)',
        solid: '#5b7b3a',
        glow: 'rgba(91, 123, 58, 0.55)',
    },
});

// Houston Texans — deep navy / red
export const texansTheme: CardTheme = defineTheme({
    id: 'texans',
    name: 'Texans',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #061427 0%, #0b2a5b 100%)',
        solid: '#0b2a5b',
        glow: 'rgba(11, 42, 91, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b80f1a 0%, #ef4444 100%)',
        solid: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #061427 0%, #4b2a4a 52%, #ef4444 100%)',
        solid: '#4b2a4a',
        glow: 'rgba(75, 42, 74, 0.55)',
    },
});

// Indianapolis Colts — royal blue / white-silver
export const coltsTheme: CardTheme = defineTheme({
    id: 'colts',
    name: 'Colts',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #1d4ed8 100%)',
        solid: '#1d4ed8',
        glow: 'rgba(29, 78, 216, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #9aa4af 0%, #e5e7eb 100%)',
        solid: '#9aa4af',
        glow: 'rgba(154, 164, 175, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #3b6aa8 52%, #d9dee5 100%)',
        solid: '#3b6aa8',
        glow: 'rgba(59, 106, 168, 0.55)',
    },
});

// Jacksonville Jaguars — teal / gold
export const jaguarsTheme: CardTheme = defineTheme({
    id: 'jaguars',
    name: 'Jaguars',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #003a3a 0%, #0f766e 100%)',
        solid: '#0f766e',
        glow: 'rgba(15, 118, 110, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b88a1e 0%, #f59e0b 100%)',
        solid: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #061a1a 0%, #134e4a 52%, #f59e0b 100%)',
        solid: '#134e4a',
        glow: 'rgba(19, 78, 74, 0.55)',
    },
});

// Kansas City Chiefs — red / gold
export const chiefsTheme: CardTheme = defineTheme({
    id: 'chiefs',
    name: 'Chiefs',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #8b0a14 0%, #e11d2e 100%)',
        solid: '#e11d2e',
        glow: 'rgba(225, 29, 46, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #caa23a 0%, #fbbf24 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #8b0a14 0%, #b24a2b 52%, #fbbf24 100%)',
        solid: '#b24a2b',
        glow: 'rgba(178, 74, 43, 0.55)',
    },
});

// Las Vegas Raiders — black / silver
export const raidersTheme: CardTheme = defineTheme({
    id: 'raiders',
    name: 'Raiders',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #9aa4af 0%, #e5e7eb 100%)',
        solid: '#9aa4af',
        glow: 'rgba(154, 164, 175, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #3a3f47 52%, #d9dee5 100%)',
        solid: '#3a3f47',
        glow: 'rgba(58, 63, 71, 0.55)',
    },
});

// Los Angeles Chargers — deep navy / electric bolt
export const chargersTheme: CardTheme = defineTheme({
    id: 'chargers',
    name: 'Chargers',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #081a33 0%, #0b2a5b 100%)',
        solid: '#0b2a5b',
        glow: 'rgba(11, 42, 91, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #f5c400 0%, #ffd24a 100%)',
        solid: '#f5c400',
        glow: 'rgba(245, 196, 0, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #2563eb 52%, #f5c400 100%)',
        solid: '#2563eb',
        glow: 'rgba(37, 99, 235, 0.55)',
    },
});

// Los Angeles Rams — royal / “bone” gold
export const ramsTheme: CardTheme = defineTheme({
    id: 'rams',
    name: 'Rams',
    group: 'nfl',
    darkCardFace: true,
    primary: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #1d4ed8 100%)',
        solid: '#1d4ed8',
        glow: 'rgba(29, 78, 216, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #e8dcc5 0%, #c9a227 100%)',
        solid: '#c9a227',
        glow: 'rgba(201, 162, 39, 0.45)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #5b5aa8 52%, #e8dcc5 100%)',
        solid: '#5b5aa8',
        glow: 'rgba(91, 90, 168, 0.45)',
    },
});

// Miami Dolphins — aqua / orange
export const dolphinsTheme: CardTheme = defineTheme({
    id: 'dolphins',
    name: 'Dolphins',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #003b3b 0%, #14b8a6 100%)',
        solid: '#14b8a6',
        glow: 'rgba(20, 184, 166, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
        solid: '#fb923c',
        glow: 'rgba(251, 146, 60, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b3b3b 0%, #1f8a86 52%, #fb923c 100%)',
        solid: '#1f8a86',
        glow: 'rgba(31, 138, 134, 0.55)',
    },
});

// Minnesota Vikings — purple / gold
export const vikingsTheme: CardTheme = defineTheme({
    id: 'vikings',
    name: 'Vikings',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #2b0a53 0%, #6d28d9 100%)',
        solid: '#6d28d9',
        glow: 'rgba(109, 40, 217, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #caa23a 0%, #fbbf24 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #2b0a53 0%, #7a3f8a 52%, #fbbf24 100%)',
        solid: '#7a3f8a',
        glow: 'rgba(122, 63, 138, 0.55)',
    },
});

// New England Patriots — navy / red
export const patriotsTheme: CardTheme = defineTheme({
    id: 'patriots',
    name: 'Patriots',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #061427 0%, #0b2a5b 100%)',
        solid: '#0b2a5b',
        glow: 'rgba(11, 42, 91, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b80f1a 0%, #ef4444 100%)',
        solid: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #061427 0%, #3b3f63 52%, #ef4444 100%)',
        solid: '#3b3f63',
        glow: 'rgba(59, 63, 99, 0.55)',
    },
});

// New Orleans Saints — black / old gold
export const saintsTheme: CardTheme = defineTheme({
    id: 'saints',
    name: 'Saints',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b88a1e 0%, #f5d07a 100%)',
        solid: '#b88a1e',
        glow: 'rgba(184, 138, 30, 0.45)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #4b3a1a 52%, #f5d07a 100%)',
        solid: '#4b3a1a',
        glow: 'rgba(75, 58, 26, 0.45)',
    },
});

// New York Giants — royal blue / red
export const giantsTheme: CardTheme = defineTheme({
    id: 'giants',
    name: 'Giants',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #1d4ed8 100%)',
        solid: '#1d4ed8',
        glow: 'rgba(29, 78, 216, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b80f1a 0%, #ef4444 100%)',
        solid: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b2a5b 0%, #4b2a6b 52%, #ef4444 100%)',
        solid: '#4b2a6b',
        glow: 'rgba(75, 42, 107, 0.55)',
    },
});

// New York Jets — deep green / black
export const jetsTheme: CardTheme = defineTheme({
    id: 'jets',
    name: 'Jets',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #06261e 0%, #14532d 100%)',
        solid: '#14532d',
        glow: 'rgba(20, 83, 45, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #06261e 0%, #1b3a33 55%, #0b0b0c 100%)',
        solid: '#1b3a33',
        glow: 'rgba(27, 58, 51, 0.55)',
    },
});

// Philadelphia Eagles — midnight green / silver
export const eaglesTheme: CardTheme = defineTheme({
    id: 'eagles',
    name: 'Eagles',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #052a2a 0%, #0f766e 100%)',
        solid: '#0f766e',
        glow: 'rgba(15, 118, 110, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #9aa4af 0%, #e5e7eb 100%)',
        solid: '#9aa4af',
        glow: 'rgba(154, 164, 175, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #052a2a 0%, #2f5a5a 52%, #d9dee5 100%)',
        solid: '#2f5a5a',
        glow: 'rgba(47, 90, 90, 0.55)',
    },
});

// Pittsburgh Steelers — black / gold
export const steelersTheme: CardTheme = defineTheme({
    id: 'steelers',
    name: 'Steelers',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #232328 100%)',
        solid: '#0b0b0c',
        glow: 'rgba(0, 0, 0, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #caa23a 0%, #fbbf24 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #0b0b0c 0%, #4b3a1a 52%, #fbbf24 100%)',
        solid: '#4b3a1a',
        glow: 'rgba(75, 58, 26, 0.55)',
    },
});

// San Francisco 49ers — red / gold
export const ninersTheme: CardTheme = defineTheme({
    id: 'niners',
    name: 'Niners',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #7a0a12 0%, #b91c1c 100%)',
        solid: '#b91c1c',
        glow: 'rgba(185, 28, 28, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b88a1e 0%, #f5d07a 100%)',
        solid: '#b88a1e',
        glow: 'rgba(184, 138, 30, 0.45)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #4b0b10 0%, #7a2a2a 52%, #f5d07a 100%)',
        solid: '#7a2a2a',
        glow: 'rgba(122, 42, 42, 0.55)',
    },
});

// Seattle Seahawks — deep navy / action green
export const seahawksTheme: CardTheme = defineTheme({
    id: 'seahawks',
    name: 'Seahawks',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #061427 0%, #0b2a5b 100%)',
        solid: '#0b2a5b',
        glow: 'rgba(11, 42, 91, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #3f8f2b 0%, #84cc16 100%)',
        solid: '#84cc16',
        glow: 'rgba(132, 204, 22, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #061427 0%, #1f4f3a 52%, #84cc16 100%)',
        solid: '#1f4f3a',
        glow: 'rgba(31, 79, 58, 0.55)',
    },
});

// Tampa Bay Buccaneers — pewter / red
export const buccaneersTheme: CardTheme = defineTheme({
    id: 'buccaneers',
    name: 'Buccaneers',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #2a2a2e 0%, #4b5563 100%)',
        solid: '#4b5563',
        glow: 'rgba(75, 85, 99, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #8b0a14 0%, #ef4444 100%)',
        solid: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #2a2a2e 0%, #6b2a33 52%, #ef4444 100%)',
        solid: '#6b2a33',
        glow: 'rgba(107, 42, 51, 0.55)',
    },
});

// Tennessee Titans — navy / “titans blue”
export const titansTheme: CardTheme = defineTheme({
    id: 'titans',
    name: 'Titans',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #061427 0%, #0b2a5b 100%)',
        solid: '#0b2a5b',
        glow: 'rgba(11, 42, 91, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #0b4a7a 0%, #38bdf8 100%)',
        solid: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #061427 0%, #1f4f7a 52%, #38bdf8 100%)',
        solid: '#1f4f7a',
        glow: 'rgba(31, 79, 122, 0.55)',
    },
});

// Washington Commanders — burgundy / gold
export const commandersTheme: CardTheme = defineTheme({
    id: 'commanders',
    name: 'Commanders',
    group: 'nfl',
    primary: {
        gradient: 'linear-gradient(135deg, #4b0b10 0%, #7a0a12 100%)',
        solid: '#7a0a12',
        glow: 'rgba(122, 10, 18, 0.55)',
    },
    secondary: {
        gradient: 'linear-gradient(135deg, #b88a1e 0%, #fbbf24 100%)',
        solid: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.55)',
    },
    neutral: {
        gradient: 'linear-gradient(135deg, #2b0a0f 0%, #6b2a2a 52%, #fbbf24 100%)',
        solid: '#6b2a2a',
        glow: 'rgba(107, 42, 42, 0.55)',
    },
});

// All available themes (includes everything registered via defineTheme)
export const themes: CardTheme[] = themeRegistry;

// Get theme by ID
export function getThemeById(id: string): CardTheme {
    return themes.find((t) => t.id === id) || classicTheme;
}
