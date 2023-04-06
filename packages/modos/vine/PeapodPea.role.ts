import { defineRole, Role, PrivateRole } from '../../etre/Role';
import { $type, Mutable } from '../../utils/types';
import { PodNode } from './PodNode.role';
import * as ThisModule from "./PeapodPea.role"
import { $PeaNode } from './PeaNode.role';
import { IReactive } from '../../paravue/reactivity';
import { enacts } from '../../etre/typecheck';
console.log('LOADING PeapodPea.role.ts ...');



export type PeapodPea = Role<typeof $PeapodPea>
type _PeapodPea = PrivateRole<typeof $PeapodPea>

export const $PeapodPea = defineRole({
    prereqs: { $PeaNode },
    interface: $type as IReactive & {
        index: number | null | undefined
    },
})

export function connectPodToPeapodPea(pea: Mutable<_PeapodPea>, pod: PodNode, index: number) {
    pea.pod = pod; //main 
    pea.index = index; //side 
}

export function disconnectPodFromPeapodPea(pea: Mutable<_PeapodPea>, pod: PodNode) {
    if (pea.pod === pod) {
        pea.pod = null; //main  //NOTE: This is necessary for garbage collecting
        pea.index = null; //side 
    }
}

if (__DEV__){
    enacts($PeapodPea, {})
}
