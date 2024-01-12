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

interface AstronomicalParametersProps {
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
}

export function AstronomicalParameters(
  props: AstronomicalParametersProps
): JSX.Element {
  const initialLong = useMemo(() => props.location.longitude, []);
  const initialLat = useMemo(() => props.location.latitude, []);

  const [time, setTime] = useState<number>(new Date().getTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date().getTime());
    }, 1000);

    // Clear the interval when the component is unmounted
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const times = getTimes(props.location.latitude, props.location.longitude);
  const timeEntries = getUniqueTypes(times); // TODO: we should just enumerate these but might switch to suncalc3

  // TODO: what if dates are invalid???

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
            }}
          >
            <div>{entry.type}</div>
            <div>
              <i>
                {humanizeDuration(millisecondsUntilDate(entry.time, time), {
                  round: true,
                })}
              </i>
            </div>
          </div>
        }
        onChange={(v) => {
          console.log("CLICK", entry.time, props.captureTimes);

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
      <OutputSpecProps
        outputFPS={props.outputFPS}
        outputDuration={props.outputDuration}
        outputSpec={props.outputSpec}
        setOutputFPS={props.setOutputFPS}
        setOutputDuration={props.setOutputDuration}
        setOutputSpec={props.setOutputSpec}
      />
      <div>
        <div style={{ padding: "7px" }} className="radio-option">
          <div>Latitude</div>
          <input
            type="number"
            className={Classes.INPUT}
            placeholder={String(initialLat)}
            value={props.location.latitude}
            onChange={(v) => {
              const newValue = Number(v.target.value);
              props.setLocation({
                ...props.location,
                latitude:
                  isNaN(newValue) || newValue <= 0 ? initialLat : newValue,
              });
            }}
          />
        </div>
        <div style={{ padding: "7px" }} className="radio-option">
          <div>Longitude</div>
          <input
            type="number"
            className={Classes.INPUT}
            placeholder={String(initialLong)}
            value={props.location.longitude}
            onChange={(v) => {
              const newValue = Number(v.target.value);
              props.setLocation({
                ...props.location,
                longitude:
                  isNaN(newValue) || newValue <= 0 ? initialLong : newValue,
              });
            }}
          />
        </div>
        <Button
          fill={true}
          onClick={() => {
            const success = (position: {
              coords: { latitude: any; longitude: any };
            }) => {
              console.log("LOCATION IS", position);
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
            navigator.geolocation.getCurrentPosition(success);
          }}
        >
          Get My Location
        </Button>
      </div>
      <Divider></Divider>
      <div style={{ padding: "7px" }}>
        <div style={{ padding: "7px" }}>Capture Times</div>
        <div>{timeCheckboxes}</div>
      </div>
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
