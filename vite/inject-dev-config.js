export default function injectDevFlag() {
  return {
    name: 'inject-dev-config',
    config(config, { mode }) {
      return {
        define: {
          __DEV__: mode !== 'production',
          // merge any existing define block
          ...config.define,
        },
      }
    },
  }
}
