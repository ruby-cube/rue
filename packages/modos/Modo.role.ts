import { $type } from "../utils/types";
import { defineRole } from "../etre/Role";
import { UID } from "./types";



export type Modo = { id: UID }

export const $Modo = defineRole({
    interface: $type as Modo
    // core: class CModel {
    //     id: UID
    //     constructor(data: { id: UID }) {
    //         this.id = data.id;
    //     }
    // },
})
