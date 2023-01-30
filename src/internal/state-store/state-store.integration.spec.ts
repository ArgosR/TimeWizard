/**
 * These are integration testing using Dapr as a storage indirection.
 * Dapr must be running for these to work
 * Run these commands before :
 * dapr init
 * dapr run --dapr-http-port 3500
 * These tests are ignored by jest
 */
import "reflect-metadata";
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ReactiveExternalStore } from "./reactive-external-store";
import { DaprClient } from "@dapr/dapr";

interface IRecordingState {
  recordsIds: string[];
  voiceChannelId: string;
  controllerState: any;
}

describe("State store::Integration", () => {
  const mockData: IRecordingState = {
    recordsIds: ["0"],
    voiceChannelId: "1",
    controllerState: undefined,
  };
  // Direct proxy access, to prevent using store methods to setup tests
  const direct = new DaprClient().state;
  beforeEach(async () => {
    // Reset state value to undefined before each test
    await direct.save("statestore", [{ key: "statekey", value: undefined }]);
  });
  describe("GET", () => {
    it("Store empty", async () => {
      const ss = new ReactiveExternalStore(
        new DaprClient().state,
        "statestore",
        "statekey"
      );
      const state = await ss.getState();
      expect(state).toBeUndefined();
    });
    it("Store non-empty", async () => {
      await direct.save("statestore", [{ key: "statekey", value: mockData }]);
      const ss = new ReactiveExternalStore(
        new DaprClient().state,
        "statestore",
        "statekey"
      );
      const state = await ss.getState();
      expect(state).toEqual(mockData);
    });
  });
  describe("SET", () => {
    it("Mutate state", async () => {
      const ss = new ReactiveExternalStore(
        new DaprClient().state,
        "statestore",
        "statekey"
      );
      expect(await ss.getState()).toEqual(undefined);
      await ss.setState(mockData);
      expect(await ss.getState()).toEqual(mockData);
    });
  });
  describe("DELETE", () => {
    it("Return state to undefined on deletion", async () => {
      const ss = new ReactiveExternalStore(
        new DaprClient().state,
        "statestore",
        "statekey"
      );
      await direct.save("statestore", [{ key: "statekey", value: mockData }]);
      expect(await ss.getState()).toEqual(mockData);
      await ss.deleteState();
      expect(await ss.getState()).toBeUndefined();
    });
  });
});
