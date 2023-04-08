import { computed, ComputedRef, DebuggerOptions, effectScope, onUnmounted as _onUnmounted, inject, isReactive, isRef, nextTick, PropType, Ref, ref, ShallowReactive, shallowReactive, toRaw, watch, WatchOptions, WatchStopHandle, onBeforeUnmount, getCurrentInstance, ComponentInternalInstance } from "vue";
import { makeActiveListener } from "../planify/ActiveListener";
import { PendingOp } from "../planify/PendingOp";
import { ActiveListener, Callback, ListenerOptions, ScheduleCancel, ScheduleStop, $listen, } from "../planify/planify";
import { scheduleAutoCleanup } from "../planify/scheduleAutoCleanup";
import { Cast, Consolidate } from "../utils/types";
import { isSettingUpComponent } from "./component";

export const reactive = shallowReactive as <T extends object>(target: T) => Reactive<T>;
export type Reactive<T> = { [P in keyof ShallowReactive<{}>]-?: true; } & T
// Required<ShallowReactive<T>>;
// export type Reactive<T> = Required<{ [Key in keyof ShallowReactive<{}>]: true } & T>;
export interface IReactive extends Reactive<{}> { };

// export function computedMethod<T, O>(cb: (thisObj: O) => T) { //TODO:  check if its being run within an effect scope. (eg. getCurrentInstance or scope), if not, need to create its own effectScope
//     let cRef: ComputedRef;
//     return function (this: O) {
//         cRef = cRef || computed(() => {
//             return cb(this);
//         })
//         return cRef.value as T;
//     }
// }



// type Watch<T> = {
//     <T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(sources: [...T], cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate> | undefined): WatchStopHandle;
//     <T extends readonly (object | WatchSource<unknown>)[], Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate> | undefined): WatchStopHandle;
//     <T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchOptions<Immediate> | undefined): WatchStopHandle;
//     <T extends object, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchOptions<Immediate> | undefined): WatchStopHandle;
// }

// interface WatchOptions extends WatchEffectOptions {
//     immediate?: boolean // default: false
//     deep?: boolean // default: false
//     flush?: 'pre' | 'post' | 'sync' // default: 'pre'
//     onTrack?: (event: DebuggerEvent) => void
//     onTrigger?: (event: DebuggerEvent) => void
//   }

export const onViewUpdated = nextTick;
export const afterReactiveFlush = nextTick;


export type RefImpl = Ref | ComputedRef | ExtensibleRef;

export type SustainedListenerReturn<CB extends Callback, OPT> = OPT extends { once: true } | { unlessCanceled: ScheduleCancel } ? PendingOp<ReturnType<CB>> : OPT extends { sustain: true } | { until: ScheduleStop } | undefined ? ActiveListener : ActiveListener;

export function r$<T extends RefImpl>(ref: T): T extends { value: infer V } ? V : T {
    if (isRef(ref) || isExtensibleRef(ref)) return (<Ref>ref).value;
    return ref as T extends { value: infer V } ? V : T;
}

export const nr = r$;

export function v$<T>(value: T): T {
    return value;
}

export const nv = v$;

// export function nv<T>(reactive: T): T{
//     return toRaw(reactive); //TODO: handle differently depending on whether in a tracking context (eg. computed cb, template, watch getter)
//     // const raw = toRaw(reactive);
//     // for (const key in raw){
//     //     const val = raw[key];
//     //     raw[key] = isReactive(val) ? nv(val) : val;
//     // }
//     // return raw;
// }

export function set$<T>(ref: { value: T } | any, value: T) {
    if (value && isRef(ref)) ref.value = value;
}



// export function r$<T>(ref: T): T extends RefImpl ? T extends {value: infer V} ? V : T : T {
//     if (isRef(ref) || isExtensibleRef(ref)) return ref.value;
//     return ref as T extends RefImpl ? T extends {value: infer V} ? V : T : T;
// }


// type ExtensibleRef = {
//     [REFOID]: true, 
//     value: any
// }

export class ExtensibleRef {
    private _value: any;
    public get value(): any {
        return this._value;
    }
}

export function isExtensibleRef(value: any): value is ExtensibleRef {
    return value instanceof ExtensibleRef
}

// set$(listItem.bullet = "*");
// set$(location, "outside")

export function onChange<
    T extends Parameters<typeof watch>[0],
    CB extends Parameters<typeof watch>[1],
    O extends ListenerOptions & WatchOptions,
>(target: T, callback: CB, options?: O) {
    return $listen(callback, options, {
        enroll(callback) {
            return watch(target, callback, options);
        },
        remove(unwatch) {
            unwatch();
        }
    });
}

export function compute<T>(getter: () => T, options?: { until: (stop: () => void) => void, $lifetime?: true } & DebuggerOptions): ComputedRef<T> {
    if (options && "until" in options) {
        let computedRef: ComputedRef<T>;
        const scope = effectScope(true);
        scope.run(() => {

            makeActiveListener({
                callback: getter,
                enroll: (getter) => {
                    if (__DEV__) computedRef = computed(getter, options); //assumes `run` runs synchronously. TODO: check if this is true
                    else computedRef = computed(getter); //assumes `run` runs synchronously. TODO: check if this is true
                },
                remove: () => scope.stop(),
                options
            })

        })
        return computedRef!;
    }
    else if (isSettingUpComponent()) {
        if (__DEV__) return computed(getter, options);
        return computed(getter);
    }
    return computed(getter)
}

const componentMap = new WeakMap();
export function onUnmounted(callback: Callback, options?: ListenerOptions) {
    const currentInstance = getCurrentInstance();
    if (!currentInstance) throw new Error("onUnmounted must be called from within component setup function")
    const existingCallbacks = componentMap.get(currentInstance);
    const callbacks = existingCallbacks ? existingCallbacks : new Set();
    if (!existingCallbacks) {
        componentMap.set(currentInstance, callbacks)
        onBeforeUnmount(() => {
            _onUnmounted(() => {
                for (const cb of callbacks) {
                    cb()
                }
            })
        })
    }
    return $listen(callback, options, {
        enroll(callback) {
            callbacks.add(callback);
        },
        remove(callback) {
            callbacks.delete(callback)
        },
        onceAsDefault: true
    })
}

if (__TEST__) {
    onUnmounted.getCallbacks = (component: ComponentInternalInstance) => componentMap.get(component);
}
