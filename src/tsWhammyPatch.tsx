import tsWhammy from "ts-whammy/src/libs";
import { IWebP, IWebPFrame } from "ts-whammy/src/libs/interfaces";
import { autoAtob } from "ts-whammy/src/libs/utils/adaptor";
import parseRIFF from "ts-whammy/src/libs/utils/parseRIFF2";
import parseWebP from "ts-whammy/src/libs/utils/parseWebP";
import toWebM from "ts-whammy/src/libs/utils/toWebM";

console.warn("Applying patch");

// An export that I can import to prevent tree shaking from eliminating this file.
// Idk why specifying it in package.json as a sideEffect isn't working.
export const sideEffectLink = "linked";

// We need the index of the error message here
tsWhammy.fromImageArray = function (
  images: string[],
  fps: number,
  outputAsArray?: boolean
): Blob | Uint8Array {
  console.warn("In whammy monkey patch!");
  const curOutputAsArray = typeof Blob !== "undefined" ? outputAsArray : true;
  const curFps = fps || 1;
  return toWebM(
    images.map((image, index) => {
      try {
        const webp: IWebP = parseWebP(parseRIFF(autoAtob(image.slice(23))));
        const webpFrame: IWebPFrame = {
          ...webp,
          duration: 1000 / curFps,
        };
        return webpFrame;
      } catch (error) {
        console.error(error);
        throw new Error(`Before toWebM Error, Image Index ${index}`);
      }
    }),
    curOutputAsArray
  );
};
