// Tailwind v4: the PostCSS plugin moved to @tailwindcss/postcss and includes
// vendor prefixing, so autoprefixer is no longer needed here.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
