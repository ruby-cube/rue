
export function areEqualSets(setA: Set<unknown>, setB: Set<unknown>) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

export const noop = () => { };
