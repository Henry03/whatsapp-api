const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    const users = (await prisma.user.findMany());

    res.send(users);
});

router.post('/', async (req, res) => {
    const newUser = req.body;

    const user = await prisma.user.create({
        data: {
            name: newUser.name,
            phone_number : newUser.phoneNumber
        }
    })

    res.status(201).send(user);
});

module.exports = router;