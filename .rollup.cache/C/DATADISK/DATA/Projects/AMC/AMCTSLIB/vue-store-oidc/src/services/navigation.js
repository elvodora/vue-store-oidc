export const openUrlWithIframe = (url) => {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("gotoUrlWithIframe does not work when window is undefined"));
        }
        const iframe = window.document.createElement("iframe");
        iframe.style.display = "none";
        iframe.onload = () => {
            var _a;
            (_a = iframe.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(iframe);
            resolve(true);
        };
        iframe.src = url;
        window.document.body.appendChild(iframe);
    });
};
//# sourceMappingURL=navigation.js.map