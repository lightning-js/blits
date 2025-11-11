export default function injectDevFlag() {
  return {
    name: 'inject-dev-config',
    config(config, { mode }) {
      return {
        define: {
          __DEV__: mode !== 'production',
        },
      }
    },
  }
}
