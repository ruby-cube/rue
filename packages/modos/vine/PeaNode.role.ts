import { Skip } from '../../utils/types';
import { defineRole, Role, PrivateRole, Data } from '../../etre/Role';
import { $type } from '../../utils/types';
import { $Modo } from '../Modo.role';
import { PodNode } from './PodNode.role';
import { IReactive } from '../../paravue/reactivity';
import { enacts } from '../../etre/typecheck';
console.log('LOADING PeaNode.role.ts ...');



export type PeaNode = Role<typeof $PeaNode>;
type _PeaNode = PrivateRole<typeof $PeaNode>;

export const $PeaNode = defineRole({
    prereqs: { $Modo },
    interface: $type as IReactive & {
        pod: PodNode | null;
    },

    isDetached() {
        return this.pod == null;
    }
})


if (__DEV__) {
    enacts($PeaNode, {})
}

