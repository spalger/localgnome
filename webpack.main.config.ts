import type { Configuration } from "webpack";
import Path from "path";

import { rules } from "./webpack.rules";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    alias: {
      main: Path.resolve(__dirname, "src/main"),
      shared: Path.resolve(__dirname, "src/shared"),
      static: Path.resolve(__dirname, "src/static"),
    },
  },
};
