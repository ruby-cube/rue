import { describe, test, expect, vi } from "vitest";
import { $type, Consolidate } from "../../types";
import { Data, defineRole } from "../Role";
import { $id, enrollModelMaker } from "../../modos/Model";
import { __$initDepotModule, populateDepot } from "../../modos/depot";

describe("reifer", () => {

    test("CASE: Reify a single role", () => {

        const $Frog = defineRole({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)

        const createFrog = $Frog.reifier((data) => {
            const frog = $Frog.confer(data);
            return {
                ...frog.methods,
                ...frog.props
            }
        });

        const frog = createFrog({ name: "sir robin" });
        expect(frog).toEqual({ croak, name: "sir robin", location: "swamp" })

    });

    test("CASE: Reify a single role with auto compose", () => {

        const $Frog = defineRole({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)

        const createFrog = $Frog.reifier();

        const frog = createFrog({ name: "sir robin" });
        expect(frog).toEqual({ croak, name: "sir robin", location: "swamp" })

    });

});

describe("enrollModelMaker", () => {

    test("CASE: Reify a single role, enroll as modo, no vine, create", () => {
        __$initDepotModule();
        const $Frog = defineRole({
            $construct(data: Data<{ name: string }>) {
                return {
                    name: data.name,
                    location: "swamp"
                }
            },
            croak() { }
        })

        const { methods: { croak } } = $Frog.confer({ name: "" } as Data<{ name: string }>)
        const depot = populateDepot.__getDepot();

        const [createFrog, FROG$] = enrollModelMaker({
            name: "Frog",
            make: $Frog.reifier((data) => {
                const frog = $Frog.confer(data);
                return {
                    ...frog.methods,
                    ...frog.props
                };
            })
        })
        const frog = createFrog({ name: "sir robin"});

        const xFrog = { id: frog.id, croak, name: "sir robin", location: "swamp" };
        const expectedDepot = new Map([
            [frog.id, xFrog],
        ]);

        expect(depot).toEqual(expectedDepot);
        expect(frog).toEqual(xFrog);
    });

});


