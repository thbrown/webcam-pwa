import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Collapse,
  Label,
  SegmentedControl,
  Slider,
  Spinner,
} from "@blueprintjs/core";
import { ChevronDown, ChevronRight } from "@blueprintjs/icons";
import { debounce } from "lodash";

interface AdvancedCameraOptionsProps {
  setCameraSettings: (value: React.SetStateAction<MediaTrackSettings>) => void;
  cameraPermission: PermissionState;
  cameraSettings: MediaTrackSettings;
  activeTrack: MediaStreamTrack;
  supportedCameraCapabilities: MediaTrackCapabilities;
  setTestSliderValue: (value: number) => void;
  testSliderValue: number;
}

export const AdvancedCameraOptions = React.memo(
  (props: AdvancedCameraOptionsProps): JSX.Element => {
    try {
      const [areAdvancedOptionsEnabled, setAreAdvancedOptionsEnabled] =
        useState<boolean>(false);

      const handleToggleAdvancedOptions = () => {
        setAreAdvancedOptionsEnabled((prev) => !prev);
      };

      const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
      };

      const applySettingsChanges = useCallback(
        debounce((constraints: MediaTrackConstraints) => {
          props.activeTrack.applyConstraints(constraints);
        }, 100),
        [props.activeTrack]
      );

      const handleAdvancedOptionChange = (
        value: string | number,
        settingsKey: keyof MediaTrackConstraintSet
      ): void => {
        console.log("Advanced Option Change", value, settingsKey);
        const patch: MediaTrackConstraintSet = {};
        patch[settingsKey] = value;
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        props.setCameraSettings({
          ...props.cameraSettings,
          ...(patch as Partial<MediaTrackSettings>),
        });
      };

      const capabilitiesSort = (
        [keyA]: [
          keyof MediaTrackSettings,
          MediaTrackSettings[keyof MediaTrackSettings] | undefined
        ],
        [keyB]: [
          keyof MediaTrackSettings,
          MediaTrackSettings[keyof MediaTrackSettings] | undefined
        ]
      ): number => {
        const lowPriorityKeys: (keyof MediaTrackSettings)[] = [
          "height",
          "width",
          "aspectRatio",
        ];
        const indexA = lowPriorityKeys.indexOf(keyA);
        const indexB = lowPriorityKeys.indexOf(keyB);

        // Move keys found in the low priority list to the bottom
        if (indexA === -1) return -1;
        if (indexB === -1) return 1;

        return indexA - indexB;
      };

      const generateUIForCameraCapabilities = (
        capabilities: MediaTrackCapabilities | undefined,
        settings: MediaTrackSettings | undefined
      ): JSX.Element[] => {
        if (capabilities === undefined) {
          return [
            <div key={"only"} style={{ padding: "20px" }}>
              <Spinner size={64} />
            </div>,
          ];
        }
        return Object.entries(capabilities)
          .sort(capabilitiesSort)
          .map((capability, index) => {
            const [key, value] = capability;

            const renderSettingUI = () => {
              if (Array.isArray(value) && value.length > 1) {
                // Render radio buttons for arrays
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <SegmentedControl
                      className="capability-input"
                      key={index}
                      inline
                      fill={true}
                      options={value.map((item) => ({
                        label: item.toString(),
                        value: item.toString(),
                      }))}
                      value={String(settings[key as keyof MediaTrackSettings])}
                      onValueChange={(v) =>
                        handleAdvancedOptionChange(
                          v,
                          key as keyof MediaTrackConstraintSet
                        )
                      }
                    />
                  </Label>
                );
              } else if (
                typeof value === "string" ||
                typeof value === "number" ||
                (Array.isArray(value) && value.length <= 1)
              ) {
                // We wont render anything for these, there is only one option
              } else if (
                value !== null &&
                typeof value === "object" &&
                typeof value.min === "number" &&
                typeof value.max === "number"
              ) {
                // Render slider for object with min, max, step properties
                const {
                  min,
                  max,
                  step = 1,
                } = value as { min: number; max: number; step?: number };
                const NUM_STEPS = 4;
                const calcStepSize = (max - min) / NUM_STEPS;
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <Slider
                      min={min}
                      max={max}
                      stepSize={Math.round(step)}
                      //initialValue={
                      //  clamp(
                      //  settings[key as keyof MediaTrackSettings] as number,
                      //  min,
                      //  max
                      //)
                      //}
                      value={clamp(
                        settings[key as keyof MediaTrackSettings] as number,
                        min,
                        max
                      )}
                      labelStepSize={calcStepSize}
                      //onChange={(v) =>
                      //  handleAdvancedOptionChange(
                      //    v,
                      //    key as keyof MediaTrackConstraintSet
                      //  )
                      //}
                      //onChange={(v) => {
                      //  const a = v.target.value;
                      //  handleAdvancedOptionChange(
                      //    a,
                      //    key as keyof MediaTrackConstraintSet
                      //  );
                      //}}
                    />
                  </Label>
                );
              } else if (typeof value === "object") {
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <div>
                      Unsupported camera option object: {JSON.stringify(value)}
                    </div>
                  </Label>
                );
              } else {
                return <div>Unsupported camera option: {value}</div>;
              }
            };

            return (
              <div
                key={index}
                style={{
                  padding: "0px 12px",
                }}
              >
                {renderSettingUI()}
              </div>
            );
          });
      };

      return (
        <>
          {props.cameraPermission === "granted" ? (
            <Button
              icon={
                areAdvancedOptionsEnabled ? <ChevronDown /> : <ChevronRight />
              }
              alignText={"left"}
              onClick={handleToggleAdvancedOptions}
              fill={true}
              outlined={false}
              style={{ marginBottom: "5px" }}
              minimal={true}
            >
              {areAdvancedOptionsEnabled ? "Hide" : "Show"} Advanced Options
            </Button>
          ) : null}
          {areAdvancedOptionsEnabled ? (
            Object.keys(props.supportedCameraCapabilities).length === 0 ? (
              <div style={{ padding: "10px" }}>
                <i>No advanced options available</i>
              </div>
            ) : (
              <div style={{ paddingTop: "10px" }}>
                <div
                  key={"TEST"}
                  style={{
                    padding: "0px 12px",
                  }}
                >
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {"TEST SLIDER"}
                    </div>
                    <Slider
                      max={10}
                      min={-2}
                      stepSize={2}
                      onChange={(v) => props.setTestSliderValue(v)}
                      value={props.testSliderValue}
                    />
                  </Label>
                </div>
                {generateUIForCameraCapabilities(
                  props.supportedCameraCapabilities,
                  props.cameraSettings
                )}
              </div>
            )
          ) : null}
        </>
      );
    } catch (e) {
      console.warn("PRINT", e);
      alert("PIZZA" + e + " - " + e.stack);
    }
  }
);
