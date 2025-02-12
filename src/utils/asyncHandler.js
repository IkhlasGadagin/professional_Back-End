const asyscHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
            catch((error) => {
                console.log("Error in asyncHandler", error);
                next(error);
            });
    }

}

export { asyscHandler };


/* const asyscHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.log("Error in asyncHandler", error);
        next(error);

    }
}
 */
