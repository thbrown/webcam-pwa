import { getPatchedWhammy } from "../tsWhammyPatch";

console.warn("Loading whammy worker");

onmessage = async (event) => {
  const { images, fps, updateProgress } = event.data;
  console.warn(
    "Whammy worker running!",
    images,
    fps,
    getPatchedWhammy().fromImageArray
  );

  const callback = (index: number) => {
    postMessage({ type: "Progress", value: index });
  };

  const videoBlob = getPatchedWhammy().modifiedFromImageArray(
    images,
    fps,
    callback
  );
  postMessage({ type: "Result", value: videoBlob });
};

export default {}; // Add a default export to satisfy the linter
