import express from "express";
import router from "./routes/analyze.routes.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/analyze", router);


app.listen(port, () =>{

    console.log(`app is runnning at port no : ${port}`);

})