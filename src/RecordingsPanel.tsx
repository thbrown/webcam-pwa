import React, { useRef, useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { Spinner } from "@blueprintjs/core";
import { SavedVideo, getIndexDbRefFromSequence } from "./CameraPanel";
import { SavedVideoPanel } from "./SavedVideo";

export function RecordingsPanel(): JSX.Element {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[] | undefined>([]);

  const getSavedVideos = async (): Promise<SavedVideo[]> => {
    const allStoredPromises: Promise<SavedVideo | null>[] = [];
    const length = await localforage.length();

    for (let i = 0; i < length; i++) {
      allStoredPromises.push(
        localforage.getItem<SavedVideo | null>(await localforage.key(i))
      );
    }

    const resolvedPromises = await Promise.all(allStoredPromises);

    // Filter out null values and ensure type safety
    const filteredVideos: SavedVideo[] = resolvedPromises.filter(
      (video) => video !== null
    ) as SavedVideo[];

    return filteredVideos;
  };

  useMemo(async () => {
    const result = await getSavedVideos();
    setSavedVideos(result);
    return result;
  }, []);

  // Loading...
  if (savedVideos === undefined) {
    return (
      <div>
        <Spinner size={64} />
      </div>
    );
  }

  const panels: JSX.Element[] = savedVideos.map((video, index) => (
    <SavedVideoPanel
      name={video.name}
      type={video.type}
      blob={undefined}
      timestamp={video.timestamp}
      indexDbKey={getIndexDbRefFromSequence(video.type, video.timestamp)}
      key={index}
    />
  ));

  return <div>{panels}</div>;
}
