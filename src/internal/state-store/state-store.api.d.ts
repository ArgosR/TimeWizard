import { MutexInterface } from "async-mutex";

/**
 * Underlying implementation of the external storage must have these methods
 */

export interface IStoreProxy {
  get(storeName: string, key: string): Promise<any>;

  save(storeName: string, [{ key: string, value: any }]): Promise<void>;
}

/** A recording store is a storage for the bot recording state.
 * This store must be available in case the bot needs to do a disaster recovery
 * */
export interface IRecordingStore<T> {
  /** Retrieve the current state */
  getState(): Promise<T | undefined>;

  /** Set the current state, this erases any other values */
  setState(state: T): Promise<void>;

  /** Set the current state to undefined */
  deleteState(): Promise<void>;

  /** Acquire a mutex on the store, making sure we're the only one editing it */
  getLock(): Promise<MutexInterface.Releaser>;

  /** Emitted when the state has changed. No data is passed along */
  on(evt: "changed", cb: (data: null) => Promise<void>);

  once(evt: "changed", cb: (data: null) => Promise<void>);
}
