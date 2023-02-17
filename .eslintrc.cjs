module.exports = {
    extends: [
        "nstarter",
        "nstarter/typescript",
    ],
    rules: {
        "max-lines-per-function": "off"
    },
    globals: {
        Constructor: "readable",
        Callback: "readable"
    }
};
