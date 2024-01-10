const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  mode: "production",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "/docs"), // docs for github pages
    filename: "bundle.js", // the name of the bundle
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html", // to import index.html file inside index.js
    }),
  ],
  devServer: {
    port: 3030, // you can change the port
    devMiddleware: {
      writeToDisk: true,
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  //plugins: [new BundleAnalyzerPlugin()],
  // This breaks dev mode
  //plugins: [
  //  new CopyPlugin({
  //    patterns: [{ from: "src/assets", to: "" }],
  //  }),
  //],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // .js and .jsx files
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-typescript"],
          },
        },
        exclude: /node_modules\/(?!ts-whammy)/,
      },
      {
        test: /\.(sa|sc|c)ss$/, // styles files
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ],
  },
};
