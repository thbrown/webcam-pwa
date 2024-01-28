import wasm_webp from "@saschazar/wasm-webp";
import defaultOptions from "@saschazar/wasm-webp/options";

// Function to convert a base64 encoded images (png, jpeg, etc.) to WebP
async function innerConvertToWebP(imageBase64: string): Promise<string> {
  let width: number, height: number, channels: number;

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

        const options = defaultOptions;
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
        console.error(e);
        alert("There was a problem converting the image to .webp " + e);
      }
    };

    img.src = imageBase64; // Set the image source to extract dimensions
  });
}

// Function to convert a base64 encoded images (png, jpeg, etc.) to WebP
// This function does the conversion in batches to avoid OOM errors
export async function convertToWebP(
  imageBase64Array: string[]
): Promise<string[]> {
  const batchSize = 50; // Define the batch size

  const batches: string[][] = [];
  for (let i = 0; i < imageBase64Array.length; i += batchSize) {
    batches.push(imageBase64Array.slice(i, i + batchSize));
  }

  const results: string[] = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(innerConvertToWebP));
    results.push(...batchResults);
  }
  return results;
}
