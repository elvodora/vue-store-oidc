import { OidcStore } from ".";
import { OidcStoreActions, OidcStoreMutations } from "./OidcStore";

export class VuexOidcStore extends OidcStore {
    get Actions(): OidcStoreActions {
        throw new Error("Method not implemented.");
    }
    get Mutations(): OidcStoreMutations {
        throw new Error("Method not implemented.");
    }
    CreateStore() {
        throw new Error("Method not implemented.");
    }
 }