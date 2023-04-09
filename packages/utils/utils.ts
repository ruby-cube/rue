import { Class } from "@rue/types";

export function areEqualSets(setA: Set<unknown>, setB: Set<unknown>) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

export const noop = () => { };

export function isClass(obj: any): obj is Class {
    return 'prototype' in obj;
}


export const $type = 0 as unknown;