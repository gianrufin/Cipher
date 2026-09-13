declare module '@tailwindcss/vite' {
  const tailwindcss: () => import('vite').PluginOption;
  export default tailwindcss;
}
