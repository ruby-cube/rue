// an IIFE alternative to isolate await

export function run<F extends () => any>(cb: F): ReturnType<F> {
    return cb();
}