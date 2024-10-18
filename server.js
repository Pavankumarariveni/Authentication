const express = require('express');
const path = require('path');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const { request } = require('http');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

let db;
const app = express();
app.use(express.json());
app.use(cors());

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: path.join(__dirname, 'users.db'),
            driver : sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log('Server is running at http://localhost:3000/');
        });
    }
    catch (error) {
        console.log(`Database Error is ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

// Sign Up

app.post('/signup', async (request,response) => {
    const {username,password,email} = request.body
    const hashedPassword = await bcrypt.hash(password,10);
    const UserQuery = `
        SELECT * FROM users WHERE username = '${username}' ;
    `;
    const dbuser = await db.get(UserQuery);
    if (dbuser == undefined) {
        const insertQuery = `
            INSERT INTO users (username,password,email) 
            VALUES ('${username}', '${hashedPassword}','${email}');
        `;
        const deResponse = await db.run(insertQuery);
        response.send({status:'User Added'});
    }
    else {
        response.status(400);
        response.send({status:'User Already Exists'});
    }
})

// Login 
app.post('/login', async (request, response) => {
    const {username,password} = request.body;
    const selectUserQuery = `
        SELECT * FROM users WHERE username = '${username}' ;
    `
    const dbUser = await db.get(selectUserQuery);
    
    if (dbUser == undefined) {
        response.status(400);
        response.send({status: "Invalid User"});
    }
    else {
        const isPasswordMatched = await bcrypt.compare(password,dbUser.password)
        if (isPasswordMatched) {
            const payload = {username: username}
            const jwtToken = jwt.sign(payload,'jwt_token')
            response.send({jwtToken})
        }
        else {
            response.status(400);
            response.send({status:"Invalid Password"});
        }
    }
});

// GET

app.get('/login/get/', async (request, response) => {
    const selectQuery = `
        SELECT * FROM users;
    `
    const dbUser = await db.all(selectQuery);
    response.send(dbUser)

})