import wasm_image_loader from "@saschazar/wasm-image-loader";
import wasm_webp from "@saschazar/wasm-webp";
import defaultOptions from "@saschazar/wasm-webp/options";
import { resolve } from "../webpack.config";

const convertUrlToBuffer = async (dataURL: string): Promise<ArrayBuffer> => {
  // Convert data URL to Blob
  const response = await fetch(dataURL);
  return new Promise((resolve, reject) => {
    resolve(response.arrayBuffer());
  });
};

// Function to convert a base64 encoded JPEG image to WebP
export async function convertToWebP(imageBase64: string): Promise<string> {
  let width: number, height: number, channels: number;

  // Extract width and height from the base64 string
  const imageDataIndex = imageBase64.indexOf("base64,") + 7; // Find the start of base64 encoded image data
  const imageData = imageBase64.substring(imageDataIndex); // Extract image data after 'base64,'

  // Create an Image object to get the dimensions of the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        width = img.width;
        height = img.height;
        channels = 4;

        // Convert to raw image via canvas
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        var imageData = ctx.getImageData(0, 0, img.width, img.height);
        var pixelData = imageData.data;
        var uint8Array = new Uint8Array(pixelData);

        //console.log("WIDTH", width, "HEIGHT", height, "DATA", uint8Array);
        const options = defaultOptions; // WebP's options, a complete object is crucially needed!
        let result;

        // Initialize the WebAssembly Module
        const webpModule = await wasm_webp();
        result = webpModule.encode(
          uint8Array,
          width,
          height,
          channels,
          options
        ); // encode image data and return a new Uint8Array
        webpModule.free(); // clean up memory after encoding is done

        // Convert the BufferSource to a Blob so we can get base 64 encoded webp image
        const blob = new Blob([result], { type: "image/webp" });
        const reader = new FileReader();
        reader.onload = function () {
          resolve(reader.result as string);
          console.log("Conversion complete");
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        alert("There was a problem converting the image to .webp " + e);
      }
    };

    // err this could be jpeg? CAn we jsut use the input string directly?
    img.src = "data:image/png;base64," + imageData; // Set the image source to extract dimensions
  });
}
