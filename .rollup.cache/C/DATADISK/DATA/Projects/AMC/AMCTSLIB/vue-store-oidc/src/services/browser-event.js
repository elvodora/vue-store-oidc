import { objectAssign } from "./utils";
// Use native custom event or DIY for IE
function createCustomEvent(eventName, detail, params) {
    const prefixedEventName = "OidcStore:" + eventName;
    if (typeof window.CustomEvent === "function") {
        params = objectAssign([params, { detail: detail }]);
        return new window.CustomEvent(prefixedEventName, params);
    }
    var evt = new CustomEvent(prefixedEventName, { detail: detail });
    return evt;
}
export function dispatchCustomBrowserEvent(eventName, detail = {}, params = {}) {
    if (window) {
        const event = createCustomEvent(eventName, objectAssign([{}, detail]), params);
        window.dispatchEvent(event);
    }
}
//# sourceMappingURL=browser-event.js.map