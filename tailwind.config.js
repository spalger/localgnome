/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/ui/**/*.tsx", "./src/index.html"],
  theme: {
    extend: {
      colors: {
        error: "var(--color-error)",
        active: "var(--color-active)",
      },
      textColor: {
        default: "var(--color-text-default)",
        error: "var(--color-text-error)",
        disabled: "var(--color-text-disabled)",
      },
    },
  },
  plugins: [],
};
