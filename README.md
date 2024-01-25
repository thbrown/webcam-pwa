# Web Timelapse 

Web timelapse video recorder.

Live at: https://thbrown.github.io/webcam-pwa/

### Develop

`npm run serve` (to /dev)

### Build

`npm run build` (to /docs)
`npm run build-dev` (to /docs)

### Notes: iOS safari

iOS Safari will not return a .webp image from `toDataURL("image/webp")`. Instead it will return a png and whammy will fail with an "InvalidCharacter" message when attempting to compile a video with png instead of webp.

To remedy this we detect if a .webp image is returned, then if not, we use a wasm lib to convert the raw image to the webp format. This requires
that `wasm_webp.js` and `wasm_webp.wasm` files be copied from to the output directory (`/docs`) from `node_modules\@saschazar\wasm-webp\...` so they can be served from the root of the web page. Static copies of these two files are also in `src/assets/*`.
