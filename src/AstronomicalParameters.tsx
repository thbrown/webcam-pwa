import {
  Button,
  Checkbox,
  Classes,
  Divider,
  Label,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { OutputSpec } from "./CameraPanel";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera } from "@blueprintjs/icons";
import "./Main.scss";
import { OutputSpecProps } from "./OutputSpec";
import SunCalc from "suncalc";

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

  const times = SunCalc.getTimes(
    new Date(),
    props.location.latitude,
    props.location.longitude
  );
  console.log(props.location, times);

  const timeCheckboxes = [];
  for (let time of Object.keys(times)) {
    timeCheckboxes.push(
      <Checkbox
        key={time}
        checked={props.captureTimes.includes(time)}
        label={time}
        onChange={(v) => {
          // Not efficient but there are so few entries it's fine
          if (props.captureTimes.includes(time)) {
            const updatedCaptureTimes = props.captureTimes.filter(
              (t) => t !== time
            );
            props.setCaptureTimes(updatedCaptureTimes);
          } else {
            const updatedCaptureTimes = [...props.captureTimes, time];
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
        <div>Capture Times</div>
        <div>{timeCheckboxes}</div>
      </div>
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
