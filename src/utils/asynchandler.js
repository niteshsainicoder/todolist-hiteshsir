const asynchandler = (requesthandler) => {
 return (req, res, next) => {
    Promise.resolve(requesthandler(req, res, next)).catch((err) => {
      console.log("error", err);
    });
  };
};
export { asynchandler }
