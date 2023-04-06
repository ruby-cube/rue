import { Cast, MiscObj } from "../utils/types";
import { makeActiveListener } from "./ActiveListener";
import { makePendingOp, PendingOp } from "./PendingOp";
import { Scene } from "./Scene";
import { existingPendingAutoCleanup, existingPendingSceneCleanup, scheduleAutoCleanup, scheduleSceneCleanup, schedulingAutoCleanup, schedulingSceneCleanup } from "./scheduleAutoCleanup";


export type ListenerOptions = {
    once?: true;
    sustain?: true;
    unlessCanceled?: ScheduleCancel;
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
}


export const $lifetime = true;
export const $tilStop = true;

export type ActiveListener = {
    stop(): void;
}

export type PendingCancelOp = {
    cancel: () => void;
}

export type CallbackRemover<R extends never | void> = {
    (): R;
    isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover<any>>;
export type ScheduleRemoval = ScheduleCancel | ScheduleStop;
export type ScheduleCancel = (cancel: CallbackRemover<never | void>) => PendingCancelOp;
export type ScheduleStop = (stop: CallbackRemover<void>) => void;


export type OneTimeListener<CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(callback: C, options?: OPT) => OneTimeListenerReturn<CB, OPT, C, MaybeCB>;

export type SustainedListener<CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(callback: C, options?: OPT) => SustainedListenerReturn<CB, OPT, C, MaybeCB>

export type OneTimeTargetedListener<T = any, CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(target: T, callback: C, options?: OPT) => OneTimeListenerReturn<CB, OPT, C, MaybeCB>;

export type SustainedTargetedListener<T = any, CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(target: T, callback: C, options?: OPT) => SustainedListenerReturn<CB, OPT, C, MaybeCB>;

export type OneTimeListenerReturn<CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = C extends { isRemover: true } ? PendingCancelOp : (OPT extends { once: true } | { unlessCanceled: ScheduleCancel } | undefined ? PendingOp<ReturnType<C>> : (OPT extends { sustain: true } | { until: ScheduleStop } | { $tilStop: true } | { $lifetime: true } ? ActiveListener : PendingOp<ReturnType<C>>));
export type SustainedListenerReturn<CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = C extends { isRemover: true } ? PendingCancelOp : OPT extends { once: true } | { unlessCanceled: ScheduleCancel } ? PendingOp<ReturnType<C>> : OPT extends { sustain: true } | { until: ScheduleStop } | undefined ? ActiveListener : ActiveListener;

export type MaybeBadScheduler<OPT, CB> = OPT extends { until: infer U } ? U extends (arg: infer P) => any ? P extends Callback ? CB : "Error: Parameter needed in `until` listener" : CB : CB;



let settingUpScene = false;
let unattachedScene = false;
export function markSceneSetup(state: boolean, unattached: boolean) {
    settingUpScene = state;
    unattachedScene = unattached;
}

type Remover = (callback: Callback) => void

export function $listen<
    CB extends Callback,
    CFG extends { remove: Remover, enroll: (callback: CB) => void, onceAsDefault?: true | undefined },
    OPT extends ListenerOptions | undefined,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(callback: CB, options: OPT, config: CFG): CFG extends { onceAsDefault: true } ? OneTimeListenerReturn<CB, OPT, C, MaybeCB> : SustainedListenerReturn<CB, OPT, C, MaybeCB> {

    const { enroll, remove, onceAsDefault } = config;
    let once: boolean | undefined = "once" in callback && callback.once === true || false;
    let sustain: boolean | undefined = true;
    const isRemover = "isRemover" in callback;
    const until = options?.until;
    const scheduleCancellation = options?.unlessCanceled;


    if (onceAsDefault) {
        sustain = options?.sustain || options?.$lifetime || options?.$tilStop;
        once = (sustain || until) ? false : true;
    }
    else {
        once = (once || options?.once || Boolean(scheduleCancellation));
        sustain = !once;
    }

    if (__DEV__) {
        if (
            options?.unlessCanceled && options?.until ||
            options?.unlessCanceled && options?.sustain ||
            options?.once && options?.sustain ||
            options?.once && options?.until ||
            options?.$lifetime && options?.$tilStop ||
            options?.$lifetime && options?.unlessCanceled ||
            options?.$lifetime && options?.until ||
            options?.$lifetime && options?.once
        ) console.warn("Hook has conflicting options. Choose only one callback removal strategy.")
        if (sustain && scheduleCancellation) throw new Error("Option `unlessCanceled` cannot be applied to a sustained hook. Use the `until` option or set the callback to run once with the `once` option");
        if (once && until) throw new Error("Option `until` cannot be applied to a hook op that runs only once. Use the `unlessCanceled` option or sustain the listener with the `sustain` option");
    }

    if (isRemover) {
        let pendingAutoCleanup: PendingCancelOp | void;
        let pendingSceneCleanup: PendingCancelOp | void;
        const _callback = () => {  // remover runs only once (self-removal)
            callback();
            remove(_callback);
            // cleanup any registered autocleanup
            if (pendingAutoCleanup) pendingAutoCleanup.cancel();
            if (pendingSceneCleanup) pendingSceneCleanup.cancel();
        }
        const cancel = () => {
            remove(_callback); // cancel remover if callback actually runs
        }
        cancel.isRemover = true as const;
        pendingAutoCleanup = initAutoCleanup(cancel)
        pendingSceneCleanup = initSceneAutoCleanup(cancel)
        enroll(<Cast>_callback as CB);

        return <Cast>{
            cancel
        } as $ListenerReturn<CFG, CB, OPT, C, MaybeCB>
    }

    if (once) {
        const [pendingOp, _callback] = makePendingOp({ //TODO: I potentially don't need to return cancel
            callback,
            remove,
            scheduleCancellation
        });

        enroll(_callback);

        return pendingOp as $ListenerReturn<CFG, CB, OPT, C, MaybeCB>
    }

    // let pendingAutoStop: PendingCancelOp | false;
    // let pendingSceneStop: PendingCancelOp | false;
    // const stop = () => {
    //     remove(callback);
    //     if (pendingAutoStop) pendingAutoStop.cancel()
    //     if (pendingSceneStop) pendingSceneStop.cancel()
    // }
    // stop.isRemover = true as const;
    // if (until) until(stop);
    // const success = pendingAutoStop = initAutoCleanup(stop);
    // pendingSceneStop = initSceneAutoCleanup(stop);
    // if (__DEV__ && !pendingSceneStop && !success && !once && !until && !$lifetime && !$tilStop) {
    //     console.warn("This listener doesn't have a callback removal strategy (run once, run until, or auto cleanup). This is considered a memory leak if this listener is not intended to last the lifetime of the app. Pass the `$lifetime` or `$tilStop` flag in the options param to prevent this warning. Also check if auto cleanup callback returns a success flag")
    //     console.trace();
    // }
    const activeListener = makeActiveListener({
        callback,
        remove
    }, options)
    enroll(callback);

    return activeListener as $ListenerReturn<CFG, CB, OPT, C, MaybeCB>
}

type $ListenerReturn<CFG, CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = CFG extends { onceAsDefault: true; } ? OneTimeListenerReturn<CB, OPT, C, MaybeCB> : SustainedListenerReturn<CB, OPT, C, MaybeCB>


export type SchedulerOptions = {
    unlessCanceled?: ScheduleCancel
}

type ScheduledOp<CB extends Callback> = CB extends { isRemover: true } ? PendingCancelOp : PendingOp<ReturnType<CB>>

export function $schedule<CB extends Callback>(callback: CB, options: SchedulerOptions | undefined, schedulerFn: (cb: Callback) => any, cancelFunction: (id: any) => void): ScheduledOp<CB> {
    let id: any;

    let pendingAutoCleanup: PendingCancelOp | void;
    let pendingSceneCleanup: PendingCancelOp | void;
    if ("isRemover" in callback) {
        const _callback = () => {
            callback();
            cancelFunction(_callback);
            if (pendingAutoCleanup) pendingAutoCleanup.cancel();
            if (pendingSceneCleanup) pendingSceneCleanup.cancel();
        }
        const cancel = () => { cancelFunction(id) }
        cancel.isRemover = true as const;
        pendingAutoCleanup = initAutoCleanup(cancel)
        pendingSceneCleanup = initSceneAutoCleanup(cancel)
        id = schedulerFn(_callback);

        return <Cast>{
            cancel
        } as ScheduledOp<CB>
    }

    const [pendingOp, _callback] = makePendingOp({
        callback,
        remove: () => { cancelFunction(id); },
        scheduleCancellation: options?.unlessCanceled
    })
    id = schedulerFn(_callback);
    return pendingOp as ScheduledOp<CB>
}


// export function initAutoCancel(cancel: CallbackRemover<void>) {
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingAutoCleanup! : false;
//     if (settingUpScene) {
//         if (!unattachedScene && !schedulingAutoCleanup)
//             success = scheduleAutoCleanup(cancel);
//     }
//     else if (!schedulingAutoCleanup) return scheduleAutoCleanup(cancel);
// }

// export function initSceneAutoCancel(cancel: CallbackRemover<void>){
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : false;
//     if (settingUpScene && !schedulingSceneCleanup) {
//        success = scheduleSceneCleanup(cancel);
//     }
//     return success;
// }


export function initAutoCleanup(stop: CallbackRemover<void>) {
    let success: void | PendingCancelOp = schedulingSceneCleanup ? existingPendingAutoCleanup! : undefined;
    if (settingUpScene) {
        if (!unattachedScene && !schedulingAutoCleanup)
            success = scheduleAutoCleanup(stop);
    }
    else {
        success = schedulingAutoCleanup ? existingPendingAutoCleanup! : scheduleAutoCleanup(stop);
    }
    return success;
}

export function initSceneAutoCleanup(stop: CallbackRemover<void>) {
    let success: void | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : undefined;
    if (settingUpScene && !schedulingSceneCleanup) {
        success = scheduleSceneCleanup(stop);
    }
    return success;
}

