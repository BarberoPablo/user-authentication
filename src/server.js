const { configuration } = require("./configuration");
require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());

let refreshTokens = []; //this should be in a database
const users = [];
const posts = [
  {
    username: "Harry",
    post: "post1",
  },
  {
    username: "David",
    post: "post2",
  },
];

function generateAccessToken(user) {
  return jwt.sign(user, configuration.jwt.accessToken.token, {
    expiresIn: configuration.jwt.accessToken.expiresIn,
  }); //  Change to 30m
}

function authenticateToken(req, res, next) {
  //  Bearer TOKEN
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }
  jwt.verify(token, configuration.jwt.accessToken.token, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    //  En "req" va a haber una propiedad user con los datos del usuario:
    req.user = user;
    next();
  });
}

async function authenticateUser(username, password) {
  try {
    const user = users.find((user) => user.username === username);
    if (!user) {
      throw {
        status: 400,
        message: "Cannot find user",
      };
    }
    if (await bcrypt.compare(password, user.password)) {
      return user;
    } else {
      throw {
        status: 400,
        message: "Not Allowed",
      };
    }
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message,
    };
  }
}

//  List all users
app.get("/users", (req, res) => {
  res.json(users);
});

//  Create user
app.post("/users", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      username,
      password: hashedPassword,
    });
    res.status(201).send();
  } catch (error) {
    res.status(500).send();
  }
});

//  User authentication first
//  If ok: create jwt
app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authenticateUser(username, password);
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, configuration.jwt.refreshToken.token); //No expire date, manually handled

    refreshTokens.push(refreshToken); // new valid refreshToken
    res.json({ accessToken: accessToken, refreshToken: refreshToken }); //lo que hace esto es crear en el header un objeto accessToken???
  } catch (error) {
    res.status(error.status || 500).send(error.message);
  }
});

app.get("/posts", authenticateToken, (req, res) => {
  const post = posts.filter((post) => post.username === req.user.username);

  res.json(post);
});

//  A partir del refresh token, generamos un access token nuevo:
//    Si no es un token válido o no me llega nada: error
//    Si me llega uno nuevo, lo añado a la coleccion de refreshTokens
app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) {
    return res.sendStatus(401); //Forbidden
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403); //No access
  }
  jwt.verify(
    refreshToken,
    configuration.jwt.refreshToken.token,
    (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      const accessToken = generateAccessToken({ username: user.username });
      res.json({ accessToken: accessToken });
    }
  );
});

//  Al deslogearse, se borra el refresh token
app.delete("/users/logout", async (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

app.listen(3000);
