import { Callback, PendingCancelOp, initAutoCleanup, initSceneAutoCleanup } from "./planify";

export function makePendingCancelOp(config: {
    callback: Callback,
    enroll: (cb: Callback) => any,
    remove: (cbOrReturnVal: any) => void
}) {
    const { callback, enroll, remove } = config
    let returnVal: any;
    let pendingAutoCleanup: PendingCancelOp | void;
    let pendingSceneCleanup: PendingCancelOp | void;
    const _callback = () => {
        callback();
        remove(returnVal ?? _callback);
        if (pendingAutoCleanup) pendingAutoCleanup.cancel();
        if (pendingSceneCleanup) pendingSceneCleanup.cancel();
    }
    const cancel = () => { remove(returnVal ?? _callback) }
    cancel.isRemover = true as const;
    pendingAutoCleanup = initAutoCleanup(cancel)
    pendingSceneCleanup = initSceneAutoCleanup(cancel)
    returnVal = enroll(_callback);

    return {
        cancel
    } as PendingCancelOp
}