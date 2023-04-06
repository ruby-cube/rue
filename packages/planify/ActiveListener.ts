import { ActiveListener, Callback, initAutoCleanup, initSceneAutoCleanup, ListenerOptions, PendingCancelOp } from "./planify";

export function makeActiveListener(
    config: {
        callback?: Callback,
        remove: (callback: (...args: any) => any) => void,
    },
    options: ListenerOptions | undefined
) {
    const until = options?.until || null;
    const { remove, callback } = config;
    let pendingAutoStop: PendingCancelOp | void;
    let pendingSceneStop: PendingCancelOp | void;
    const stop = () => {
        remove(callback!);
     
        if (pendingAutoStop) pendingAutoStop.cancel()
        if (pendingSceneStop) pendingSceneStop.cancel()
    }
    stop.isRemover = true as const;
    if (until) until(stop);

    const success = pendingAutoStop = initAutoCleanup(stop);
    pendingSceneStop = initSceneAutoCleanup(stop);

    if (__DEV__) {
        const { until, $lifetime, $tilStop, once } = options || {};
        if (!pendingSceneStop && !success && !once && !until && !$lifetime && !$tilStop) {
            console.warn("This listener doesn't have a callback removal strategy (run once, run until, or auto cleanup). This is considered a memory leak if this listener is not intended to last the lifetime of the app. Pass the `$lifetime` or `$tilStop` flag in the options param to prevent this warning. Also check if auto cleanup callback returns a success flag")
            console.trace();
        }
    }

    return {
        stop
    } as ActiveListener
}
