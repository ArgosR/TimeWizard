/**
 * Thread-safe implement of a state storage
 * This is deemed "reactive", at it will emit event when changed
 */
import { inject, injectable } from "inversify";
import { IRecordingStore, IStoreProxy } from "./state-store.api";
import { TYPES } from "../../types";
import { Mutex, MutexInterface } from "async-mutex";
import * as EventEmitter from "events";

@injectable()
export class ReactiveExternalStore<T extends IStoreProxy, S>
  extends EventEmitter
  implements IRecordingStore<S>
{
  private readonly mutex = new Mutex();

  /** storeProxy is the objet used to get to the store */
  constructor(
    @inject(TYPES.StoreProxy) private readonly storeProxy: T,
    private readonly storeName: string,
    private readonly stateKey: string
  ) {
    super();
  }

  async getLock(): Promise<MutexInterface.Releaser> {
    return this.mutex.acquire();
  }

  /**
   * Retrieve the current state
   * @returns current state or undefined if no previous state has been defined
   */
  async getState(): Promise<S | undefined> {
    const state = await this.storeProxy.get(this.storeName, this.stateKey);
    // The state could be either an empty string or an object
    if (state === undefined || state === null || state.length === 0)
      return undefined;

    return state;
  }

  /**
   * Set the bot state
   * @param state
   */
  async setState(state: S) {
    await this.storeProxy.save(this.storeName, [
      {
        key: this.stateKey,
        value: state,
      },
    ]);
    this.emit("changed");
  }

  async deleteState(): Promise<void> {
    await this.storeProxy.save(this.storeName, [
      {
        key: this.stateKey,
        value: undefined,
      },
    ]);
  }
}
