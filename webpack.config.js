const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const isDevServer = process.argv.includes("serve");
console.log("Is dev server", isDevServer);

module.exports = {
  mode: "production",
  devtool: isDevServer ? "eval-source-map" : "source-map",
  output: {
    path: isDevServer
      ? path.resolve(__dirname, "dev")
      : path.resolve(__dirname, "docs"), // Because this is where github pages likes it
    filename: "bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: isDevServer ? "index.html" : "../docs/index.html",
      template: "src/index.html",
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
  // Adding any plugins somehow prevents the index.html file from being served on devServer
  /*
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "src/assets", to: "" }],
    }),
    // new BundleAnalyzerPlugin(),
  ],
  */
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
