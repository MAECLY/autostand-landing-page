// Tailwind v4 through PostCSS: Next owns the pipeline, so the Vite plugin the
// other surfaces use does not apply here.
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
