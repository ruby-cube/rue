import { ActiveListener } from "../../planify/planify";
import { beginScene } from "../../planify/Scene";
import { useEventListener } from "../event-listeners";


const onMouseDown = useEventListener("mousedown");
const onMouseLeave = useEventListener("mouseleave");
const onMouseEnter = useEventListener("mouseenter");
const onMouseUp = useEventListener("mouseup");
const onMouseMove = useEventListener("mousemove");
const onClick = useEventListener("click");

export async function reMouseDown(e: MouseEvent) {
    const scene = beginScene()
    const { target } = e;
    if (target === null) return;
    let action: "click" | "dragdrop" = "click";
    let mouseMoveListener: ActiveListener;


    onMouseLeave(target, () => {
        initDrag();
    }, { until: scene.ended })

    onMouseEnter(target, () => {
        stopDrag();
    }, { until: scene.ended })



    function initDrag() {
        action = "dragdrop"
        mouseMoveListener =
            onMouseMove(document, (e) => {
                console.log("moving object")
            }, { until: scene.ended })
    }

    function stopDrag() {
        action = "click"
        mouseMoveListener.stop();
    }


    await onMouseUp(document, (e) => {
        if (action === "dragdrop") {
            console.log("dropped object");
        }
        scene.end();
    });

    if (action === "click") {
        onClick(target, () => {
            console.log("clicked")
        }, { once: true })
    }
}

onMouseDown(document.getElementById("event-test")!, reMouseDown);