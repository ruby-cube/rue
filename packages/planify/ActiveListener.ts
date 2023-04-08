import { ActiveListener, Callback, initAutoCleanup, initSceneAutoCleanup, ListenerOptions, PendingCancelOp } from "./planify";

export function makeActiveListener<R, Arg extends R extends void ? Callback : R, CB extends Callback>(
    config: {
        callback: CB,
        enroll: (callback: CB) => R,
        remove: (cbOrReturnVal: Arg) => void,
    },
    options: ListenerOptions | undefined
) {
    const until = options?.until || null;
    const { enroll, remove, callback } = config;
    let returnVal: any;
    let pendingAutoStop: PendingCancelOp | void;
    let pendingSceneStop: PendingCancelOp | void;
    const stop = () => {
        remove(returnVal ?? callback!);
     
        if (pendingAutoStop) pendingAutoStop.cancel()
        if (pendingSceneStop) pendingSceneStop.cancel()
    }
    stop.isRemover = true as const;
    if (until) until(stop);
    returnVal = enroll(callback);

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
