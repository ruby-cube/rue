

// USAGE:

import { Modo } from "../../modos/Modo.role";
import { $type } from "../../utils/types";
import { defineMessage } from "..";


const ACTIVATE_SPOTLIGHT = defineMessage({
    message: "activate-spotlight",
    targetID: $type as Modo,
    // returnType: $type as boolean,
    data: {
        snow: "hei"
    }
})


// USAGE:


// const ACTIVATE_SPOTLIGHT = defineMessage({
//     message: "activate-spotlight",
//     targetID: $type as Object,
//     data: {
//         snow: "hei"
//     },
//     onceAsDefault: true
// })


// const item = $type as Modo;


// send(ACTIVATE_SPOTLIGHT, { to: item }, { snow: "ljk" })

// const activateSpotlightListener =
//     heed(ACTIVATE_SPOTLIGHT, item, (ctx) => {
//         ctx.snow
//         return "sdkjf"
//     }, { once: true })




// heedActivateSpotlight.stop(item)