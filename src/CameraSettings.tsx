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
import { CameraStatus } from "./CameraPanel";
import { RecordingStatus } from "./App";

interface CameraSettingsProps {
  setCameraSettings: (value: React.SetStateAction<MediaTrackSettings>) => void;
  cameraStatus: CameraStatus;
  cameraSettings: MediaTrackSettings;
  activeTrack: MediaStreamTrack;
  supportedCameraCapabilities: MediaTrackCapabilities;
  recordingStatus: RecordingStatus;
  cameraSettingsLoading: string[];
  setCameraSettingsLoading: (value: string[]) => void;
}

type aspectRatio = "16:9" | "4:3" | "3:2" | "1:1";
type resolution = "SD" | "HD" | "FHD" | "UHD" | "*";

export const CameraSettings = React.memo(
  (props: CameraSettingsProps): JSX.Element => {
    try {
      const [areAdvancedOptionsEnabled, setAreAdvancedOptionsEnabled] =
        useState<boolean>(false);

      const handleToggleAdvancedOptions = () => {
        setAreAdvancedOptionsEnabled((prev) => !prev);
      };

      const invertObject = (
        obj: Record<string, number | null>
      ): Record<number | null, string> => {
        const invertedObj: Record<number | null, string> = {};

        for (const [key, value] of Object.entries(obj)) {
          invertedObj[value] = key;
        }

        return invertedObj;
      };

      const resolutionHeightLookup = {
        SD: 480,
        HD: 720,
        FHD: 1080,
        UHD: 2160, // TODO: exclude any of these options that are below the max rez of the frame
        //Max: props?.supportedCameraCapabilities?.height?.max, // TODO: exclude this if no max specified
        "*": null as number, // TODO: implement this
      };

      const invertedResolutionHeightLookup = invertObject(
        resolutionHeightLookup
      );

      const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
      };

      const parseAspectRatio = (aspectRatioString: string) => {
        const parts = aspectRatioString.split(":");

        // Invalid aspect ratio format
        if (parts.length !== 2) {
          alert(
            "Invalid aspectRatio. Please enter a number followed by ':' then another number."
          );
        }

        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);

        if (
          isNaN(numerator) ||
          isNaN(denominator) ||
          denominator === 0 ||
          numerator === 0
        ) {
          alert("Invalid aspectRatio. Please enter numerical non-zero values.");
        }

        return numerator / denominator;
      };

      const applySettingsChanges = useCallback(
        debounce(async (constraints: MediaTrackConstraints) => {
          // TODO: We need to save camera settings to localforage and re-apply on load I think...
          console.log("Applying camera settings", constraints.advanced[0]);
          props.setCameraSettingsLoading(Object.keys(constraints)); // TODO: we need to make sure this isn't called concurrently
          try {
            const originalAspectRatio =
              props.activeTrack.getSettings()?.aspectRatio;
            await props.activeTrack.applyConstraints(constraints);
            console.log("Constraints applied", props.activeTrack.getSettings());
            if (constraints.advanced[0].aspectRatio) {
              if (
                constraints.advanced[0].aspectRatio !==
                props.activeTrack.getSettings().aspectRatio
              ) {
                console.warn(
                  "Unexpected aspect ratio change! ",
                  originalAspectRatio,
                  props.activeTrack.getSettings().aspectRatio
                );
                // Re-apply (Not sure if this works or not)
                await props.activeTrack.applyConstraints(constraints);
              }
            }
            props.setCameraSettings(props.activeTrack.getSettings());
            // TODO: sometimes the aspect ratio comes back inexplicably different... can we detect this and try to re-apply the correct constraints?
          } catch (e) {
            alert(e);
          } finally {
            props.setCameraSettingsLoading([]);
          }
        }, 100),
        [props.activeTrack]
      );

      const handleAdvancedOptionStringChange = (
        value: string,
        settingsKey: keyof MediaTrackConstraintSet
      ): void => {
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

      const handleAdvancedOptionNumberChange = (
        value: number,
        settingsKey: keyof MediaTrackSettings
      ): void => {
        const patch: MediaTrackConstraintSet = {};
        patch[settingsKey as keyof MediaTrackConstraintSet] = value;
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        const reactStateUpdate = {} as MediaTrackSettings;
        //@ts-ignore
        reactStateUpdate[settingsKey] = value;
        props.setCameraSettings({
          ...props.cameraSettings,
          ...reactStateUpdate,
        });
      };

      const handleResolutionChange = (value: resolution): void => {
        const aspectRatio = props.cameraSettings.aspectRatio;
        const height = resolutionHeightLookup[value];
        const width = Math.round(aspectRatio * height);
        const patch: MediaTrackConstraintSet = {
          //width,
          height,
          aspectRatio,
        };
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        const reactStateUpdate = {
          //width,
          height,
          aspectRatio,
        } as MediaTrackSettings;
        props.setCameraSettings({
          ...props.cameraSettings,
          ...reactStateUpdate,
        });
      };

      const handleAspectRatioChange = (value: aspectRatio): void => {
        const aspectRatio = parseAspectRatio(value);
        const height = props.cameraSettings.height;
        const patch: MediaTrackConstraintSet = {
          height,
          aspectRatio,
        };
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        const reactStateUpdate = {
          height,
          aspectRatio,
        } as MediaTrackSettings;
        props.setCameraSettings({
          ...props.cameraSettings,
          ...reactStateUpdate,
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
        const groupedSettings: (keyof MediaTrackSettings)[][] = [
          [
            "whiteBalanceMode" as keyof MediaTrackSettings,
            "colorTemperature" as keyof MediaTrackSettings,
          ],
          [
            "exposureMode" as keyof MediaTrackSettings,
            "exposureTime" as keyof MediaTrackSettings,
          ],
          [
            "focusMode" as keyof MediaTrackSettings,
            "focusDistance" as keyof MediaTrackSettings,
          ],
        ];

        // Find the custom priority group to which the keys belong
        const groupA = groupedSettings.find((group) => group.includes(keyA));
        const groupB = groupedSettings.find((group) => group.includes(keyB));

        if (groupA && groupB && groupA === groupB) {
          return groupA.indexOf(keyA) - groupA.indexOf(keyB);
        } else if (groupA && groupB) {
          return (
            groupedSettings.indexOf(groupA) - groupedSettings.indexOf(groupB)
          );
        } else if (groupA && !groupB) {
          return 1;
        } else if (!groupA && groupB) {
          return -1;
        } else {
          // Alphabetical otherwise
          return keyA.localeCompare(keyB);
        }
      };

      const getAspectRatio = (aspectRatio: number) => {
        const tolerance = 0.0001;
        if (Math.abs(aspectRatio - 16 / 9) < tolerance) {
          return "16:9";
        } else if (Math.abs(aspectRatio - 4 / 3) < tolerance) {
          return "4:3";
        } else if (Math.abs(aspectRatio - 3 / 2) < tolerance) {
          return "3:2";
        } else if (Math.abs(aspectRatio - 1 / 1) < tolerance) {
          return "1:1";
        } else {
          return undefined;
        }
      };

      const roundToShortReadable = (num: number): number => {
        const absNum = Math.abs(num);
        if (absNum >= 1) {
          const magnitude = Math.pow(10, Math.floor(Math.log10(absNum)));
          return (Math.round((num / magnitude) * 10) / 10) * magnitude;
        } else {
          const precision = Math.pow(10, Math.ceil(-Math.log10(absNum)) + 1);
          return Math.round(num * precision) / precision;
        }
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
        let hasWidth = null;
        let hasHeight = null;
        let hasAspectRatio = null;
        const settingsElements = Object.entries(capabilities)
          .sort(capabilitiesSort)
          .map((capability, index) => {
            const [key, value] = capability;

            const renderSettingUI = () => {
              if (key === "width") {
                hasWidth = value;
              } else if (key === "height") {
                hasHeight = value;
              } else if (key === "aspectRatio") {
                hasAspectRatio = value;
              } else if (Array.isArray(value) && value.length > 1) {
                // Render radio buttons for arrays
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ width: "70%", overflow: "auto" }}>{key}</div>
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
                        handleAdvancedOptionStringChange(
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
                // We wont render anything for one option fields
              } else if (
                value !== null &&
                typeof value === "object" &&
                typeof value.min === "number" &&
                typeof value.max === "number" &&
                value.max > value.min
              ) {
                // Render slider for object with min, max, step properties
                const {
                  min,
                  max,
                  step = 1,
                } = value as { min: number; max: number; step?: number };
                const NUM_STEPS = 4;
                const calcLabelStepSize = (max - min) / NUM_STEPS;
                const shortStep = roundToShortReadable(step);
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ width: "70%", overflow: "auto" }}>{key}</div>
                    <div
                      style={{
                        width: "100%",
                        overflow: "hidden",
                        paddingRight: "25px",
                        paddingLeft: "15px",
                      }}
                    >
                      <Slider
                        max={max}
                        min={min}
                        stepSize={shortStep > 0 ? shortStep : (max - min) / 10}
                        onChange={(v) =>
                          handleAdvancedOptionNumberChange(
                            v,
                            key as keyof MediaTrackConstraintSet
                          )
                        }
                        value={clamp(
                          props.cameraSettings[
                            key as keyof MediaTrackSettings
                          ] as number,
                          min,
                          max
                        )}
                        labelStepSize={
                          calcLabelStepSize > 0 ? calcLabelStepSize : undefined
                        }
                      />
                    </div>
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
                return (
                  <div>
                    Unsupported camera option: {value} {value}
                  </div>
                );
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

        // Add special controls for camera resolution if width, height, and aspect ratio are present
        // All the cameras, OSs, and browsers I've test have at least these three properties.
        if (hasWidth && hasHeight && hasAspectRatio) {
          if (props.recordingStatus === "Stopped") {
            settingsElements.unshift(
              <div
                key={"-2"}
                style={{
                  padding: "0px 12px",
                }}
              >
                <Label style={{ display: "flex" }}>
                  <div style={{ width: "70%" }}>aspectRatio</div>
                  <SegmentedControl
                    className="capability-input"
                    inline
                    fill={true}
                    options={["16:9", "4:3", "3:2", "1:1"].map((item) => ({
                      label: item.toString(),
                      value: item.toString(),
                      disabled: props.cameraSettingsLoading.length !== 0,
                    }))}
                    value={getAspectRatio(props.cameraSettings.aspectRatio)}
                    onValueChange={(v) =>
                      handleAspectRatioChange(v as aspectRatio)
                    }
                  />
                </Label>
              </div>
            );
            settingsElements.unshift(
              <div
                key={"-1"}
                style={{
                  padding: "0px 12px",
                }}
              >
                <Label style={{ display: "flex" }}>
                  <div style={{ width: "70%" }}>resolution</div>
                  <SegmentedControl
                    className="capability-input"
                    inline
                    fill={true}
                    options={Object.keys(resolutionHeightLookup)
                      .filter(
                        (v) =>
                          resolutionHeightLookup[
                            v as keyof typeof resolutionHeightLookup
                          ] <= props?.supportedCameraCapabilities?.height?.max
                      )
                      .map((item) => ({
                        label: item.toString(),
                        value: item.toString(),
                        disabled: props.cameraSettingsLoading.length !== 0,
                      }))}
                    value={
                      invertedResolutionHeightLookup[
                        props.cameraSettings.height
                      ] ?? "*"
                    }
                    onValueChange={(v) =>
                      handleResolutionChange(v as resolution)
                    }
                  />
                </Label>
              </div>
            );
          } else {
            settingsElements.unshift(
              <div
                key={"-1"}
                style={{
                  padding: "18px 12px",
                  textAlign: "center",
                }}
              >
                <i>
                  The <b>resolution</b> and <b>aspectRatio</b> settings are not
                  available while actively recording
                </i>
              </div>
            );
          }
        }
        return settingsElements;
      };

      return (
        <>
          {props.cameraStatus === "initialized" ? (
            <div className={"expansion-button-container"}>
              <Button
                icon={
                  areAdvancedOptionsEnabled ? <ChevronDown /> : <ChevronRight />
                }
                alignText={"left"}
                onClick={handleToggleAdvancedOptions}
                fill={true}
                outlined={false}
                minimal={true}
              >
                {areAdvancedOptionsEnabled ? "Hide" : "Show"} Camera Settings
              </Button>
            </div>
          ) : null}
          {areAdvancedOptionsEnabled ? (
            Object.keys(props.supportedCameraCapabilities).length === 0 ? (
              <div className="expansion-content">
                <i>No camera settings available</i>
              </div>
            ) : (
              <div className="expansion-content">
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
      alert("Camera Settings Error " + e + " - " + e.stack);
    }
  }
);
