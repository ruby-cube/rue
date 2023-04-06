import { currentEvent, queueTask } from "../thread";


function reMouseDown(event: Event) {
    doSomething();
}

function doSomething() {
    currentEvent.ps(() => {

    })
}


queueTask(() => {

}).then(() => {

}).then(() => {

})

const pendingTask = queueTask(() => {
    return "frog"
})

pendingTask.then(() => {

})


await queueTask(() => {

})