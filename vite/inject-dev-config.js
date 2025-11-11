export default function injectDevFlag() {
  return {
    name: 'inject-dev-config',
    config(config, { mode }) {
      return {
        define: {
          // merge any existing define block
          ...config.define,
          __DEV__: mode !== 'production',
        },
      }
    },
  }
}
