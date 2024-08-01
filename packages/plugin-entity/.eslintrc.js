module.exports = {
    extends: [
        "nstarter",
        "nstarter/typescript",
    ],
    rules: {
        "max-depth": ["error", 6]
    },
    globals: {
        Constructor: "readable"
    }
};
