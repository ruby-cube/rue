import {
  onMounted,
  onBeforeUnmount,
} from "vue";
import { isArray } from "../utils/array";
import { $Event } from "./all-event-types";

type EventHandlerArgs<H extends EventHandler> = Parameters<H>;
type Options<H extends EventHandler> = AddEventListenerOptions & { perInstance?: EventHandlerArgs<H> | boolean; runOnce?: boolean, args?: EventHandlerArgs<H> }; // `runOnce` is the same as `once`, just added for a less ambiguous API
type GlobalListenerConfig<H extends EventHandler> = {
  [property in keyof { document?: any; window?: any }]: Listener<H>[];
}
type EventHandler = ((...args: any) => void);
type Listener<H extends EventHandler> = [string, H, Options<H>?];

const _globalHandlersMap = new Set(); // Ensures handlers are only attached once and not per instance

export const $event = {} as $Event

export function attachGlobalListeners<H extends EventHandler>(globalListeners: GlobalListenerConfig<H>) {
  onMounted(() => {
    for (const nodeKey in globalListeners) {
      const listeners = globalListeners[<"document" | "window">nodeKey];
      if (listeners == null) throw new Error("globalListeners object contains a key that is neither 'document' nor 'window'");
      const node = nodeKey === "document" ? document : window;
      attachListenersToNode(node, listeners);
    }
  })
}

function attachListenersToNode<H extends EventHandler>(node: Document | Window, listeners: Listener<H>[]) {
  for (const listener of listeners) {
    const [event, handler, options] = listener;
    let eventHandler = <unknown>null as EventListenerOrEventListenerObject;
    if (options?.runOnce === true) options.once = true;
    if (options?.perInstance) {
      const perInstance = options.perInstance;
      const args = isArray(perInstance) ? perInstance : undefined;
      if (__DEV__ && options?.args && args) console.warn("Event handler args should not be defined in both `perInstance` and `args` fields of `eventListenerConfig`")
      eventHandler = wrapHandler(handler, options?.once, options?.args || args)
    }
    else {
      if (_globalHandlersMap.has(handler)) return;
      _globalHandlersMap.add(handler);
      eventHandler = wrapHandler(handler, options?.once, options?.args);
    }

    node.addEventListener(event, eventHandler, options);
    if (!options || !options.once) {
      onBeforeUnmount(() => {
        node.removeEventListener(event, eventHandler);
        _globalHandlersMap.delete(handler);
      })
    }
  }
}

function wrapHandler(handler: EventHandler, once: boolean | undefined, args: any[] | undefined) {
  if (once && args) {
    return (event: Event) => {
      const _args = resolveEventArg(event, args);
      handler(..._args);
      _globalHandlersMap.delete(handler);
    }
  }
  else if (once) {
    return (event: Event) => {
      handler(event);
      _globalHandlersMap.delete(handler);
    }
  }
  else if (args) {
    return (event: Event) => {
      const _args = resolveEventArg(event, args);
      handler(..._args);
    }
  }
  else {
    return handler;
  }
}

// Replaces $event stand-in with the actual event object
function resolveEventArg(event: Event, args: any[]) {
  const _args = [];
  for (const arg of args) {
    if (arg === $event) {
      _args.push(event);
    }
    else {
      _args.push(arg);
    }
  }
  return _args;
}
