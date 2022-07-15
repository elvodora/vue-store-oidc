export default (store) => {
    return (to, from, next) => {
        store.oidcCheckAccess(to)
            .then((hasAccess) => {
            if (hasAccess) {
                next();
            }
        });
    };
};
//# sourceMappingURL=create-router-middleware.js.map