<script lang='ts'>
import { defineComponent, onMounted, ref } from "vue";
import { onDidSomething } from './de-contract';
import { doSomething } from './de-service';
import { createHook } from "../Hook"

export default defineComponent({
    props: {},
    components: {},
    setup() {
        const [castCompleted, onCompleted] = createHook({
            hook: "completed-hook"
        })

        onDidSomething((data) => {

        }, { until: onCompleted})


        return {
            doSomething
        };
    },
});
</script>

<template>
    <div @click="doSomething">hello world</div>
</template>

<style lang='scss'>
button {
    padding: 10px;
    background-color: aliceblue;
    margin: 10px;
    border-radius: 5px;
}
</style>