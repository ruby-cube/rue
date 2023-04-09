import { Callback } from "../../planify/planify";
import { $type } from "../../types";
import { createHook } from "../Hook";

{ //CASE: listener has been wrapped improperly, expect error
    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as {
            foo: "A"
        },
    });
    const [castEnd, onEnd] = createHook({
        hook: "end-hook4",
    });
    function onWrappedEnd<T extends Callback>(cb: T) {
        return onEnd(() => cb());
    }

    //@ts-expect-error: must return PendingCancelOp
    onTestCase(() => { }, { unlessCanceled: onWrappedEnd });
}