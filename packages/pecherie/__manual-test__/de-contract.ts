import { $type } from "../../types";
import { createHook } from "../Hook";

export const [castDidSomething, onDidSomething] = createHook({
    hook: "did-something",
    data: $type as {
        frog: number
    },
})