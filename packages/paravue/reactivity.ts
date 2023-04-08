import { computed, ComputedRef, DebuggerOptions, effectScope, onUnmounted as _onUnmounted, inject, isReactive, isRef, nextTick, PropType, Ref, ref, ShallowReactive, shallowReactive, toRaw, watch, WatchOptions, WatchStopHandle, onBeforeUnmount, getCurrentInstance, ComponentInternalInstance } from "vue";
import { makeActiveListener } from "../planify/ActiveListener";
import { Callback, ListenerOptions, $listen} from "@rue/planify";
import { isSettingUpComponent } from "./component";

export const reactive = shallowReactive as <T extends object>(target: T) => Reactive<T>;
export type Reactive<T> = { [P in keyof ShallowReactive<{}>]-?: true; } & T
export interface IReactive extends Reactive<{}> { };

export const onViewUpdated = nextTick;
export const afterReactiveFlush = nextTick;


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
