import type { Configuration } from "webpack";
import Path from "path";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

plugins.push(new MiniCssExtractPlugin());

rules.push({
  test: /\.css$/,
  use: [
    MiniCssExtractPlugin.loader,
    { loader: "css-loader" },
    { loader: "postcss-loader" },
  ],
});

export const rendererConfig: Configuration = {
  devtool: "inline-cheap-source-map",
  target: "electron-renderer",
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      ui: Path.resolve(__dirname, "src/ui"),
      shared: Path.resolve(__dirname, "src/shared"),
      static: Path.resolve(__dirname, "src/static"),
    },
  },
};
