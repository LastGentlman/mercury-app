/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // VS Code inspired colors
        vscode: {
          editor: "hsl(var(--vscode-editor-bg))",
          sidebar: "hsl(var(--vscode-sidebar-bg))",
          panel: "hsl(var(--vscode-panel-bg))",
          titlebar: "hsl(var(--vscode-titlebar-bg))",
          statusbar: "hsl(var(--vscode-statusbar-bg))",
          tab: "hsl(var(--vscode-tab-bg))",
          'tab-active': "hsl(var(--vscode-tab-active-bg))",
          selection: "hsl(var(--vscode-selection-bg))",
          hover: "hsl(var(--vscode-hover-bg))",
          button: "hsl(var(--vscode-button-bg))",
          'button-hover': "hsl(var(--vscode-button-hover-bg))",
          input: "hsl(var(--vscode-input-bg))",
          dropdown: "hsl(var(--vscode-dropdown-bg))",
          scrollbar: "hsl(var(--vscode-scrollbar-bg))",
          'scrollbar-thumb': "hsl(var(--vscode-scrollbar-thumb))",
        },
      },
    },
  },
  plugins: [],
} 