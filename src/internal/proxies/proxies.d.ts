/**
 * This file contains every proxy definition
 * These can be Dar proxy object to allow for easier mocking
 */

import { HttpMethod } from "@dapr/dapr";

/**
 * Proxy interface to allow the actual bindings calls to be mocked
 */
export interface IBindingProxy {
  send(
    bindingName: string,
    operation: string,
    data: any,
    metadata?: { path?: string; query?: string }
  );
}

/**
 * Proxy interface to allow the actual services invocations calls to be mocked
 */
export interface IInvocationProxy {
  invoke(
    appId: string,
    path: string,
    method: HttpMethod,
    data: any
  ): Promise<any>;
}

/**
 * Proxy interface for a Pub/Sub Client
 */
export interface IPubSubClientProxy {
  /**
   * Publish *data* to a topic *topic* on the pubsub component *pubsubname*
   * @param pubSubName
   * @param topic
   * @param data
   */
  publish(
    pubSubName: string,
    topic: string,
    data?: Record<string, unknown>
  ): Promise<boolean>;
}

/**
 * Proxy interface for a Pub/Sub server
 */
export interface IPubSubServerProxy {
  /**
   * Subscribes to a topic *topic* on the pubsub component name *pubsubname*.
   * Calls *cb* when a message is received
   * @param pubSubName
   * @param topic
   * @param cb
   */
  subscribe(
    pubSubName: string,
    topic: string,
    cb: (data: any) => Promise<any>
  ): Promise<void>;

  /**
   * Starts the server
   */
  start(): Promise<void>;
}
