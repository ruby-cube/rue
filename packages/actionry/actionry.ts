//@-ts-nocheck
import { $type, MiscObj } from '../utils/types';
import { createHook } from '../pecherie/Hook';
import { createTargetedHook } from '../pecherie/TargetedHook';


//NOTE: An action is the main operation that captures user intent.

// const moduleRegistrarCBs = new Set() as Set<Function>;
// function registerWithModules(action) {
//     console.log("registerWithMODULES", action)
//     for (const registrar of moduleRegistrarCBs) {
//         console.log("running registrar")
//         registrar(action);
//     }
// }
// export function enlistActionRegistrar(cb) {
//     console.log("enlisting registrar", cb);
//     moduleRegistrarCBs.add(cb);
// }

// const registeredActions = new Set();
// export function registerAction(action) {
//     console.log("registering action", action);
//     registeredActions.add(action.do);
//     registerWithModules(action);
// }



export type ActionContext = {
    event?: { type: string }
} & MiscObj


let activeActions: Set<string> = new Set();

export function isFinalActiveAction() {
    return activeActions.size === 1;
}


const [castActionStart, _onActionStart] = createHook({
    hook: "action-start",
    data: $type as {
        action: string,
    } & ActionContext,
    dataAsArg: true
});

export const onActionStart = _onActionStart;
// (cb: Parameters<typeof _onActionStart>[0], options?: Parameters<typeof _onActionStart>[1]) => _onActionStart(cb, options || { $lifetime });



const [castActionCallbackDone, _onActionCallbackDone] = createTargetedHook({
    hook: "action-callback-done",
    data: $type as {
        returnValue: unknown;
    },
    onceAsDefault: true
});

export const onActionCallbackDone = _onActionCallbackDone;



const [castActionCompleted, _onActionCompleted] = createTargetedHook({
    hook: "action-completed",
    data: $type as {
        returnValue: unknown;
    },
    onceAsDefault: true
});

export const onActionCompleted = _onActionCompleted;


export function doAction<A extends N, CB extends (actionName: A) => any, C extends ActionContext, N extends string>(actionName: A, actionCallback: CB, context?: C): ReturnType<CB>;
export function doAction<A extends F, CB extends ($do: A) => any, C extends ActionContext, F extends (...args: any[]) => any>(actionFn: A, actionCallback: CB, context?: C): ReturnType<CB>;
export function doAction<A extends F | N, CB extends ($action: A) => any, C extends ActionContext, N extends string, F extends (...args: any[]) => any>(actionNameOrFn: A, actionCallback: CB, context?: C): ReturnType<CB> {
    const actionName = typeof actionNameOrFn === "string" ? actionNameOrFn : actionNameOrFn.name;
    const _context = context || {};
    if (__DEV__) console.log("[" + context?.event?.type.toUpperCase() + "]", "ACTION:", actionName);
    const action = { action: actionName, ..._context }
    castActionStart(action);
    activeActions.add(actionName);
    if (__DEV__ && activeActions.size > 1) console.warn(`Overlapping Actions: ${activeActions}`)

    const returnValue = actionCallback(actionNameOrFn);

    if (returnValue instanceof Promise) {
        returnValue.then((value) => {
            console.log("castActionCompleted!!")
            castActionCompleted(action, {
                returnValue: value
            });
            activeActions.delete(actionName);
        })
    }
    else {
        afterReactiveFlush(() => {
            console.log("castActionCompleted", action)
            castActionCompleted(action, {
                returnValue
            })
            activeActions.delete(actionName);
        })
    }

    castActionCallbackDone(action, {
        returnValue
    });
    return returnValue as ReturnType<CB>;
}






