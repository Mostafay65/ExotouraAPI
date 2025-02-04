export default (asyncfn) => {
    return (req, res, next) => {
        asyncfn(req, res, next).catch(next);
    };
};
