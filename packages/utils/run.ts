// an IIFE alternative to isolate await

export function run<F extends () => any>(cb: F) {
    return cb() as ReturnType<F>;
}