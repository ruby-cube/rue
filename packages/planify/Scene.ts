//@ts-nocheck
import { createHook } from "@rue/pecherie"
import { Callback, markSceneSetup, OneTimeListener } from './planify';
import { defineSceneCleanup } from './scheduleAutoCleanup';

export type Scene = {
    end: () => void;
    ended: OneTimeListener<(ctx: {
        hook: "scene-ended";
    }) => unknown>
}

export const UNATTACHED = true;


export function beginScene(setUpScene?: (scene: Scene) => void, unattached: boolean = false) {
    const [end, ended] = createHook({
        hook: "scene-ended",
        onceAsDefault: true
    })

    const scene = { end, ended }
    defineSceneCleanup(ended);

    if (setUpScene) {
        markSceneSetup(true, unattached);
        setUpScene(scene);
        markSceneSetup(false, unattached);
    }
    return scene;
}

export function defineScene<CB extends (context: any, scene: Scene) => any>(cb: CB) {
    return (context: Parameters<CB>[0]) => {
        beginScene((scene) => {
            cb(context, scene);
        })
    }
}


const reMouse = defineScene((event: MouseEvent, scene) => {
    

})


// //USAGE:

// function reMouseDown() {
//     const scene = beginScene();
//     onMouseMove(document, () => {
//         // do stuff
//     }, { until: scene.ended })

//     onMouseUp(document, () => {
//         // do stuff
//         scene.end();
//     })
// }

// function reMouseDown() {
//     const scene =
//         beginScene(() => {
//             onMouseMove(document, () => {
//                 // do stuff
//             })

//             onMouseUp(document, () => {
//                 // do stuff
//                 scene.end();
//             })
//         });

// }

// function reMouseDown() {
//     beginScene((scene) => {
//         onMouseMove(document, () => {
//             // do stuff
//         })

//         onMouseUp(document, () => {
//             // do stuff
//             scene.end();
//         })
//     });
// }