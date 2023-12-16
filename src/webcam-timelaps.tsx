import React, { useRef, useState, useEffect } from 'react';
import tsWhammy from 'ts-whammy/src/libs'

export function WebcamTimelapse(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [timeLapseInterval, setTimeLapseInterval] = useState<number>(1000); // default 1 second
  const [outputFPS, setOutputFPS] = useState<number>(30); // default 1 second
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Use useRef to store the interval ID so it persists across renders
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Access webcam stream
  const startVideo = (): void => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("error accessing webcam", err));
  };

  // Start time-lapse recording
  const startTimelapse = (): void => {
    if (!recording) {
      if(videoUrl !== undefined) {
        cleanupResources(videoUrl);
      }
      setRecording(true);
      captureFrame();
      // Store the interval ID in the ref
      intervalIdRef.current = setInterval(captureFrame, timeLapseInterval);
      console.log("Start recording!!", intervalIdRef.current)
    }
  };

  // Draw video frame to canvas
  const captureFrame = (): void => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const frame = canvasRef.current.toDataURL('image/webp');
        setCapturedFrames(prevFrames => {
          const newFrames = [...prevFrames, frame];
          console.log("Capturing frame!", newFrames.length); // Log the number of frames captured
          return newFrames;
        });
      }
    }
  };

  // Stop time-lapse recording
  const stopTimelapse = (): void => {
    if (recording) {
      console.log("Stop recording!!", intervalIdRef.current);
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null; // Clear the stored interval ID
      }
      setRecording(false);
      // Wait for the last frames to be captured before compiling the video
      setTimeout(() => {
        console.log("Number of frames before compiling:", capturedFrames.length);
        compileTimelapseVideo();
      }, timeLapseInterval + 100); // Wait slightly longer than the capture interval
    }
  };

  // Compile frames into a video
  const compileTimelapseVideo = (): void => {
    const videoBlob = framesToVideo(capturedFrames);
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    setVideoUrl(videoUrl);

    const playbackContainer = document.getElementById('timelapsePlaybackContainer');
    const downloadLinkContainer = document.getElementById('downloadLink');
    if (playbackContainer) {
      playbackContainer.innerHTML = '';
      playbackContainer.appendChild(videoElement);

      // Provide download link for the video
      const downloadLink = document.createElement('a');
      downloadLink.href = videoUrl;
      downloadLink.download = 'timelapse.webm';
      downloadLink.textContent = 'Download Timelapse Video';
      downloadLinkContainer.appendChild(downloadLink);
    }
  };

  function uint8ArrayToBlob(uint8Array: Uint8Array, mimeType='application/octet-stream') {
    // Create a new Blob from the Uint8Array
    return new Blob([uint8Array], { type: mimeType });
  }

  // Convert captured frames to a video blob
  const framesToVideo = (frames: string[]): Blob => {
    //const webmBlob = tsWhammy.fromImageArray(frames, 1000 / timeLapseInterval);
    const webmBlob = tsWhammy.fromImageArray(frames, outputFPS);
    console.log("BLOB IS", webmBlob);
    if(webmBlob instanceof Uint8Array) {
      console.log('webm output is Uint8Array converting... not sure if this is correct');
      return uint8ArrayToBlob(webmBlob);
    }
    return webmBlob;
  };

  // Cleanup resources after compiling the video
  const cleanupResources = (videoUrl: string): void => {
    console.log("Clean up resources");

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(videoUrl);

    // Clear the captured frames
    setCapturedFrames([]);

    // Stop the video stream
    /*
    if (videoRef.current && videoRef.current.srcObject) {
      const mediaStream = videoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    */
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalIdRef.current); // Clear interval on unmount
    };
  }, []);

  return (
    <div className="WebcamTimelapse">
      <video ref={videoRef} autoPlay muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />

      <div>
        <label htmlFor="timeLapseInterval">Frame Interval (ms): </label>
        <select
          id="timeLapseInterval"
          value={timeLapseInterval}
          onChange={(e) => setTimeLapseInterval(Number(e.target.value))}
        >
          <option value="100">100</option>
          <option value="500">500</option>
          <option value="1000">1000</option>
          <option value="5000">5000</option>
        </select>
        <label htmlFor="outputFPS">Output FPS: </label>
        <select
          id="outputFPS"
          value={outputFPS}
          onChange={(e) => setOutputFPS(Number(e.target.value))}
        >
          <option value="24">24</option>
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="120">120</option>
        </select>
      </div>

      <button onClick={startVideo}>Start Webcam</button>
      <button onClick={startTimelapse} disabled={recording}>Start Timelapse</button>
      <button onClick={stopTimelapse} disabled={!recording}>Stop Timelapse</button>
      <div id="timelapsePlaybackContainer"></div>
      <div id="downloadLink"></div>
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024