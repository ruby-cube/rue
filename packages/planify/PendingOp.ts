import { Callback, CallbackRemover, initAutoCleanup, initSceneAutoCleanup, PendingCancelOp, ScheduleCancel } from "./planify";

export type PendingOp<T = unknown> = Promise<T> & {
    cancel: () => void;
}


export class Cancellation {
    reason: string | undefined;
    constructor(reason?: string) {
        this.reason = reason;
    }
}



export function makePendingOp<CB extends (...args: any) => any>(config: {
    callback: CB,
    remove: (callback: (...args: any) => any) => void,
    scheduleCancellation: ScheduleCancel | null | undefined
}): [PendingOp<ReturnType<CB>>, CB] {
    const { callback, remove, scheduleCancellation } = config;
    let $resolve: (reason?: any) => void;
    let $reject: (reason?: any) => void;
    const pendingOp = new Promise((resolve, reject) => {
        $resolve = resolve;
        $reject = reject;
    }) as PendingOp<ReturnType<CB>>;

    let pendingAutoCleanup: PendingCancelOp | void;
    let pendingSceneCleanup: PendingCancelOp | void;
    const _cancel = ((arg: any) => {
        remove(_callback);
        if (pendingAutoCleanup) pendingAutoCleanup.cancel(); 
        if (pendingSceneCleanup) pendingSceneCleanup.cancel(); 
        if (arg) {
            console.trace();
            $reject(new Cancellation("Potential memory leak detected. Callback remover may have been wrapped. This prevents cleanup of callback remover. Check trace for wrapped listeners with wrapped callbacks."));
        }
        else {
        $resolve(new Cancellation("Pending op canceled."))
        }
    }) as CallbackRemover<never | void>;
    _cancel.isRemover = true as const; // Serves as a marker to indicate it should run only once if passed into a listener.
    pendingOp.cancel = _cancel;

    const pendingCancelOp = scheduleCancellation ? scheduleCancellation(_cancel) : null;
    pendingAutoCleanup = initAutoCleanup(_cancel)
    pendingSceneCleanup = initSceneAutoCleanup(_cancel)
    if (__DEV__ && pendingCancelOp === undefined) console.warn("Cancellation Scheduler doesn't return a pending op for cleanup. This could potentially cause a memory leak")  //TBH, this is not a serious memory leak since it'll just run a callback that deletes a non-existent callback. But it may be more complicated for instance hooks...

    const _callback = (pendingCancelOp ? (arg: unknown) => {
        remove(_callback);
        pendingCancelOp.cancel();
        $resolve(callback(arg));
    } : (arg: unknown) => {
        remove(_callback);
        $resolve(callback(arg));
    }) as CB

    return [pendingOp, _callback]
}