import { describe, test, expect, vi } from "vitest";
import { $type } from "../../utils/types";
import { createHook } from "../Hook";
import { defineAutoCleanup } from "../../planify/scheduleAutoCleanup";
import { $lifetime, $tilStop } from "../../planify/planify";
import { createTargetedHook } from "../TargetedHook";



describe("one time callbacks are run only once", () => {

    test("CASE: onceAsDefault: true", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb);

        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1)
    });


    test("CASE: options {once: true}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { once: true });

        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1)
    });


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook1",
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { unlessCanceled: onEnd });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        castTestCase(model, { foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase(model, { foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });


    test("CASE: onceAsDefault & options {once: true}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { once: true });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        castTestCase(model, { foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });


    test("CASE: onceAsDefault & options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook2",
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { unlessCanceled: onEnd });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        castTestCase(model, { foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase(model, { foo: "A" });
        castTestCase(model, { foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });

});




describe("one time callbacks can be canceled", () => {


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook3",
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { unlessCanceled: onEnd });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)
        //@ts-expect-error
        const endCallbacks = onEnd.callbacks
        castEnd()
        castTestCase(model, { foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });


    test("CASE: options {once: true}, pendingOp.cancel()", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });

        const cb = vi.fn(() => { })
        const model = {};
        const pendingOp = onTestCase(model, cb, { once: true });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        pendingOp.cancel();
        castTestCase(model, { foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
    });


    test("CASE: onceAsDefault, pendingOp.cancel()", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true,
        });

        const cb = vi.fn(() => { })
        const model = {};
        const pendingOp = onTestCase(model, cb);
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        pendingOp.cancel();
        castTestCase(model, { foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
    });



});



describe("Canceler will be cleaned up if one time callback is run", () => {


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook4",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const endCallbacks = onEnd.callbacks
        const model = {};
        onTestCase(model, cb, { unlessCanceled: onEnd });
        castEnd();
        castTestCase(model, { foo: "A" }); // callback called, endCallbacks.size === 0
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });


    test("CASE: onceAsDefault & options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook5",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const endCallbacks = onEnd.callbacks
        const model = {};
        onTestCase(model, cb, { unlessCanceled: onEnd });
        castEnd();
        castTestCase(model, { foo: "A" }); // callback called, endCallbacks.size === 0
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });

});



describe("sustained listeners run until stopped", () => {


    test("CASE: `until` option", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
        })
        const [castEnd, onEnd] = createHook({
            hook: "end-hook6",
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { until: onEnd });
        //@ts-expect-error
        const endCallbacks = onEnd.callbacks
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);

        castEnd();
        expect(endCallbacks.size).toBe(0);
        expect(testCallbacks.size).toBe(0);

        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
    });


    test("CASE: listener.stop()", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
        })
        const cb = vi.fn(() => { })
        const model = {};
        const listener = onTestCase(model, cb, { $tilStop });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model);

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);

        listener.stop();
        expect(testCallbacks.size).toBe(0);

        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
    });


    test("CASE: auto cleanup (cleans up both targetmap and callbacks set", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        defineAutoCleanup((cleanup) => {
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
        })
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
        })

        const cb = vi.fn(() => { })
        const model = {};
        settingUp = true;
        onTestCase(model, cb);
        settingUp = false;
        //@ts-ignore
        const unmountedCallbacks = onTestUnmounted.callbacks
        //@ts-ignore
        const testCallbacks = onTestCase.targetMap.get(model)
        //@ts-ignore
        const targetMap = onTestCase.targetMap

        expect(unmountedCallbacks.size).toBe(2);
        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
        
        castTestUnmounted();
        
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
        expect(testCallbacks.size).toBe(0);
        expect(targetMap.size).toBe(0);
        expect(unmountedCallbacks.size).toBe(0);
    });

    // test.only("CASE: auto cleanup registers cleanup of targetMap and callbacks set", () => {
    //     defineAutoCleanup((cleanup) => {
    //         console.log("sched cleanup to TestUnmounted", cleanup.toString())
    //         onTestUnmounted(cleanup);
    //         return true;
    //     })
    //     const [castTestUnmounted, onTestUnmounted] = createHook({
    //         hook: "test-unmounted-hook",
    //     });
    //     const [castTestCase, onTestCase] = createTargetedHook({
    //         hook: "test-hook",
    //     })

    //     const cb = vi.fn(() => { })
    //     const model = {};
    //     onTestCase(model, cb);
    //     //@ts-expect-error
    //     const unmountedCallbacks = onTestUnmounted.callbacks
    //     //@ts-expect-error
    //     const testCallbacks = onTestCase.targetMap.get(model)
    //     //@ts-expect-error
    //     const targetMap = onTestCase.targetMap

    //     expect(unmountedCallbacks.size).toBe(2);
    //     castTestCase(model);
    //     castTestCase(model);
    //     castTestCase(model);
    //     expect(cb).toHaveBeenCalledTimes(3);

    //     castTestUnmounted();

    //     castTestCase(model);
    //     expect(cb).toHaveBeenCalledTimes(3);
    //     expect(testCallbacks.size).toBe(0);
    //     expect(targetMap.size).toBe(0);
    // });

});


describe("options should override default", () => {

    test("CASE: onceAsDefault and sustain", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { sustain: true });

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test("CASE: onceAsDefault and until", () => {
        const [castEnd, onEnd] = createHook({
            hook: "end-hook6",
        });
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { until: onEnd });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model)

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);

        castEnd();
        expect(testCallbacks.size).toBe(0);
    });


    test("CASE: onceAsDefault and $lifetime", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        onTestCase(model, cb, { $lifetime });

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test("CASE: onceAsDefault and $tilStop", () => {
        const [castTestCase, onTestCase] = createTargetedHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        const model = {};
        const listener = onTestCase(model, cb, { $tilStop });
        //@ts-expect-error
        const testCallbacks = onTestCase.targetMap.get(model);

        castTestCase(model);
        castTestCase(model);
        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);

        listener.stop();
        expect(testCallbacks.size).toBe(0);

        castTestCase(model);
        expect(cb).toHaveBeenCalledTimes(3);
    });


})
