import { OidcStore } from "./OidcStore";
import { OidcStoreActions, OidcStoreMutations } from "../types";

export class VuexOidcStore extends OidcStore {
    get Actions(): OidcStoreActions {
        throw new Error("Method not implemented.");
    }
    get Mutations(): OidcStoreMutations {
        throw new Error("Method not implemented.");
    }
 }