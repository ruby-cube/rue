

// USAGE:

import { Modo } from "../modos/Modo.role";
import { $type } from "../utils/types";
import { defineMessage } from "./Archer";


const ACTIVATE_SPOTLIGHT = defineMessage({
    message: "activate-spotlight",
    targetID: $type as Modo,
    // returnType: $type as boolean,
    data: {
        snow: "hei"
    }
})
