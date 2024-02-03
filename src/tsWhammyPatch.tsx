import tsWhammy from "ts-whammy/src/libs";
import { IWebP, IWebPFrame } from "ts-whammy/src/libs/interfaces";
import { autoAtob } from "ts-whammy/src/libs/utils/adaptor";
import parseRIFF from "ts-whammy/src/libs/utils/parseRIFF2";
import parseWebP from "ts-whammy/src/libs/utils/parseWebP";
import toWebM from "ts-whammy/src/libs/utils/toWebM";

console.warn("Applying whammy patch");

// We need the index of the error message here
//@ts-ignore
tsWhammy.modifiedFromImageArray = function (
  images: string[],
  fps: number,
  updateProgress: (index: any) => void
): Blob | Uint8Array {
  const curOutputAsArray = typeof Blob !== "undefined" ? false : true;
  const curFps = fps || 1;
  return toWebM(
    images.map((image, index) => {
      updateProgress(index);
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

export const getPatchedWhammy = () => {
  return tsWhammy;
};
