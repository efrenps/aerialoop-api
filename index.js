const express = require('express')
let cors = require("cors");
const app = express()

let indexRouter = require("./src/routes/index");
const port = 3000

app.use(cors());
app.use("/", indexRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
