const express = require('express');
const dotenv = require('dotenv');
const router = require('./controller/router');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/v1', router)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
