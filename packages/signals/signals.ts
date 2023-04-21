//-@ts-nocheck
import { Cast } from "@rue/types";
import { ComputedRef, Ref, ShallowRef, computed, isRef, reactive, shallowReactive, shallowRef, triggerRef } from "vue";


export type Signal<T> = () => T;

type PrivateSignal<T> = {
    (): T;
    _ref: ShallowRef<T>;
}


export function $<T>(value: T): Signal<T> {
    const ref = shallowRef(value);
    const signal = () => ref.value;
    signal._ref = ref;
    return signal;
}


export function computed$<F extends () => any>(computation: F) {
    const computedRef = computed(computation);
    return () => computedRef.value;
}

export function $set<T>(signal: Signal<T>, valueOrManipulator: T) {
    const isManipulator = typeof valueOrManipulator === "function" && typeof (<PrivateSignal<T>>signal)._ref.value !== "function";
    if (isManipulator) {
        const manipulate = valueOrManipulator;
        manipulate((<PrivateSignal<T>>signal)._ref.value) //TODO:
    }
    else {
        const value = valueOrManipulator;
        (<PrivateSignal<T>>signal)._ref.value = value; //TODO: 
    }
}


type Signalizable<T extends { [key: string]: any }> = T extends any[] ? never : T extends Map<any, any> ? never : T extends Set<any> ? never : T extends { [key: string]: any } ? T : never;

export function signalize<T extends { [key: string]: any }>(obj: Signalizable<T>) {
    validateSignalizeInput(obj);
    const signalObj = {} as T extends Signalizable<T> ? { [Key in keyof T as Key extends string ? `${Key}$` : never]: Signal<T[Key]> } : never;
    for (const key in obj) {    //TODO: see if proxy implementation would be more performant
        //@ts-expect-error
        signalObj[genSignalKey(key)]
            = $(obj[key])
    }
    return signalObj;
}

export function signalize$<T extends { [key: string]: any }>(obj: Signalizable<T>) {
    return $(signalize(obj));
}


type DeepSignalized$<T> = Signal<{ [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends Signalizable<{ [key: string]: any }> ? DeepSignalized$<T[Key]> : Signal<T[Key]> }>

export function deepSignalize<T extends { [key: string]: any }>(obj: Signalizable<T>): T extends Signalizable<T> ? { [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends Signalizable<T[Key]> ? DeepSignalized$<T[Key]> : Signal<T[Key]> } : never {
    validateSignalizeInput(obj);
    const signalObj = {};
    for (const key in obj) {
        const value = obj[key];
        if (isSignalizable(value)) {
            //@ts-expect-error
            signalObj[genSignalKey(key)]
                = deepSignalize$(obj[key])
        }
        else {
            //@ts-expect-error
            signalObj[genSignalKey(key)]
                = $(value);
        }
    }
    //@ts-expect-error
    return signalObj;
}


export function deepSignalize$<T extends { [key: string]: any }>(obj: Signalizable<T>): T extends Signalizable<T> ? DeepSignalized$<T> : Signal<T> {
    //@ts-expect-error
    return $(deepSignalize(obj));
}


export function $mutate<T extends Object>(mutable$: Signal<T>, mutation: (iterable: T) => void) {
    const iterable = mutable$();
    mutation(iterable);
    triggerRef((<PrivateSignal<T>>mutable$)._ref);
}



function genSignalKey<K extends string>(key: K): `${K}$` {
    return `${key}$`;
}

function validateSignalizeInput(input: any): asserts input is { [key: string]: any } {
    if (!(input instanceof Object) || isNonSignalizableObject(input))
        throw new Error("Signalize must take in a non-iterable object")
}

function isSignalizable(input: any) {
    return input instanceof Object && !isNonSignalizableObject(input);
}

function isNonSignalizableObject(input: any) {
    return input instanceof Array || input instanceof Set || input instanceof Map
}








