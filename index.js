import dotenv from "dotenv";
dotenv.config();
import { app } from "./src/app.js";


import connectdb from "./src/db/indexdb.js";
const port = process.env.PORT ;

await connectdb()
  .then(() => {
    app.listen(port,  () => {
      console.log(`server is running on ${port}`);
      
    });
  })
  .catch((error) => {
    console.log("the error is :", error);
  });
