const express = require('express');
const dotenv = require('dotenv');
// const whatsapp = require('./config/whatsappClient')
const userController = require("./controller/userController");
const whatsappController = require('./controller/whatsappController');
// whatsapp.initialize();
const app = express();
const port = process.env.PORT;
app.use(express.json());

dotenv.config();

app.use("/users", userController);
app.use("/api", whatsappController);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})