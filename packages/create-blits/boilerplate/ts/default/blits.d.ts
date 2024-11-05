// required for suppressing vscode typescript errors when importing .blits files in JS/TS files
declare module '*.blits' {
  const value: any;
  export default value;
}
