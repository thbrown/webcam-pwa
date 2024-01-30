import { Button, Checkbox, Classes, Divider } from "@blueprintjs/core";
import React, { useState, useEffect, useMemo } from "react";
import { OutputSpec } from "./CameraPanel";
import "./Main.scss";
import { OutputSpecProps } from "./OutputSpec";
import {
  getTimes,
  getUniqueTypes,
  millisecondsUntilDate,
} from "./SolarTimeUtil";
import humanizeDuration from "humanize-duration";
import { ChevronDown, ChevronRight } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";

interface SolarParametersProps {
  location: {
    longitude: number;
    latitude: number;
  };
  captureTimes: string[];
  setLocation: (location: { longitude: number; latitude: number }) => void;
  setCaptureTimes: (duration: string[]) => void;
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
  recordingStatus: RecordingStatus;
}

export function SolarParameters(props: SolarParametersProps): JSX.Element {
  const [areSolarPositionsEnabled, setAreSolarPositionsEnabled] =
    useState<boolean>(true);
  const [time, setTime] = useState<number>(new Date().getTime());
  const [localLongitude, setLocalLongitude] = useState<number | "">(
    props.location.longitude
  );
  const [localLatitude, setLocalLatitude] = useState<number | "">(
    props.location.latitude
  );

  const initialLong = useMemo(() => props.location.longitude, []);
  const initialLat = useMemo(() => props.location.latitude, []);

  const handleToggleSolarPositions = () => {
    setAreSolarPositionsEnabled(!areSolarPositionsEnabled);
  };

  useEffect(() => {
    if (props.location.longitude === initialLong && localLongitude === "") {
      return;
    }
    setLocalLongitude(props.location.longitude);
  }, [props.location.longitude]);

  useEffect(() => {
    if (props.location.latitude === initialLat && localLatitude === "") {
      return;
    }
    setLocalLatitude(props.location.latitude);
  }, [props.location.latitude]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date().getTime());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const times = getTimes(props.location.latitude, props.location.longitude);
  const timeEntries = getUniqueTypes(times);

  const timeCheckboxes = [];
  for (let entry of timeEntries) {
    timeCheckboxes.push(
      <Checkbox
        key={entry.type}
        checked={props.captureTimes.includes(entry.type)}
        children={
          <div
            style={{
              display: "flex",
              marginTop: "-18px",
              justifyContent: "space-between",
              textWrap: "nowrap",
            }}
          >
            <div>{entry.type}</div>
            <div>
              <i>
                in{" "}
                {humanizeDuration(millisecondsUntilDate(entry.time, time), {
                  round: true,
                  largest: 2,
                })}
              </i>
            </div>
          </div>
        }
        onChange={(v) => {
          // Not efficient but there are so few entries it's fine
          if (props.captureTimes.includes(entry.type)) {
            const updatedCaptureTimes = props.captureTimes.filter(
              (t) => t !== entry.type
            );
            props.setCaptureTimes(updatedCaptureTimes);
          } else {
            const updatedCaptureTimes = [...props.captureTimes, entry.type];
            props.setCaptureTimes(updatedCaptureTimes);
          }
        }}
      />
    );
  }

  return (
    <div>
      {props.recordingStatus === "Stopped" ? (
        <>
          <div className="mode-description">
            <b>Solar</b> Choose solar positions and get daily frames. Perfect
            for tracking the sun's journey or creating timelapse with specific
            lighting conditions.
          </div>
          <Divider></Divider>
        </>
      ) : null}
      {props.recordingStatus === "Stopped" ? (
        <>
          <div>
            <div style={{ padding: "7px" }} className="radio-option">
              <div>Latitude</div>
              <input
                type="number"
                className={Classes.INPUT}
                placeholder={String(initialLat)}
                value={localLatitude}
                style={{
                  backgroundColor:
                    props.location.latitude !== localLatitude
                      ? "pink"
                      : undefined,
                }}
                onChange={(v) => {
                  const newValue = parseFloat(v.target.value);
                  if (
                    isNaN(newValue) ||
                    newValue < -90 ||
                    newValue > 90 ||
                    props.location.latitude === newValue
                  ) {
                    setLocalLatitude(isNaN(newValue) ? "" : newValue);
                    if (isNaN(newValue)) {
                      props.setLocation({
                        ...props.location,
                        latitude: initialLat,
                      });
                    }
                  } else {
                    props.setLocation({
                      ...props.location,
                      latitude: newValue,
                    });
                  }
                }}
              />
            </div>
            <div style={{ padding: "7px" }} className="radio-option">
              <div>Longitude</div>
              <input
                type="number"
                className={Classes.INPUT}
                placeholder={String(initialLong)}
                value={localLongitude}
                style={{
                  backgroundColor:
                    props.location.longitude !== localLongitude
                      ? "pink"
                      : undefined,
                }}
                onChange={(v) => {
                  const newValue = parseFloat(v.target.value);
                  if (
                    isNaN(newValue) ||
                    newValue < -180 ||
                    newValue > 180 ||
                    props.location.longitude === newValue
                  ) {
                    setLocalLongitude(isNaN(newValue) ? "" : newValue);
                    if (isNaN(newValue)) {
                      props.setLocation({
                        ...props.location,
                        longitude: initialLong,
                      });
                    }
                  } else {
                    props.setLocation({
                      ...props.location,
                      longitude: newValue,
                    });
                  }
                }}
              />
            </div>
            <Button
              className="spacer-vert accessible-button"
              fill={true}
              onClick={() => {
                const success = (position: {
                  coords: { latitude: any; longitude: any };
                }) => {
                  props.setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  });
                };

                const showError = (error: any) => {
                  switch (error.code) {
                    case error.PERMISSION_DENIED:
                      break;
                    case error.POSITION_UNAVAILABLE:
                      alert("Geo position unavailable.");
                      break;
                    case error.TIMEOUT:
                      break;
                    case error.UNKNOWN_ERROR:
                      alert(
                        "An unknown error occurred while fetching geo location."
                      );
                      break;
                  }
                };
                navigator.geolocation.getCurrentPosition(success, showError);
              }}
            >
              Get My Location
            </Button>
          </div>

          <div className={"expansion-button-container"}>
            <Button
              icon={
                areSolarPositionsEnabled ? <ChevronDown /> : <ChevronRight />
              }
              alignText={"left"}
              onClick={handleToggleSolarPositions}
              fill={true}
              outlined={false}
              minimal={true}
              className={"expansion-button"}
            >
              {areSolarPositionsEnabled ? "Hide" : "Show"} Solar Positions
            </Button>
          </div>
          {areSolarPositionsEnabled ? (
            <div className="expansion-content">
              <div>{timeCheckboxes}</div>
              <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                <Button
                  onClick={() => {
                    props.setCaptureTimes(timeEntries.map((v) => v.type));
                    console.log("All");
                  }}
                  outlined={true}
                  style={{ marginBottom: "5px" }}
                  minimal={true}
                  className="accessible-button"
                >
                  Select All
                </Button>{" "}
                <Button
                  onClick={() => {
                    console.log("None");
                    props.setCaptureTimes([]);
                  }}
                  outlined={true}
                  style={{ marginBottom: "5px" }}
                  minimal={true}
                  className="accessible-button"
                >
                  Select None
                </Button>
              </div>
            </div>
          ) : null}
          <Divider></Divider>
        </>
      ) : null}
      <OutputSpecProps
        outputFPS={props.outputFPS}
        outputDuration={props.outputDuration}
        outputSpec={props.outputSpec}
        setOutputFPS={props.setOutputFPS}
        setOutputDuration={props.setOutputDuration}
        setOutputSpec={props.setOutputSpec}
      />
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
