import path from "path"
import HtmlWebpackPlugin from "html-webpack-plugin"

export default {
  entry: "./src/index.ts",
  plugins: [
    new HtmlWebpackPlugin({
      title: "RWRTW test",
    }),
  ],
  devtool: "source-map",
  devServer: {
    static: "./dist",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.lib.json",
        },
        include: path.resolve(import.meta.dirname, "src"),
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        include: path.resolve(import.meta.dirname, "src"),
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(import.meta.dirname, "dist"),
  },
  mode: "production",
}
