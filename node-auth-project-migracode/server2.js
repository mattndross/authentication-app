const jwt = require("jsonwebtoken"); //para generar tokens
const fs = require("fs"); //para modificar files locales
const bcrypt = require("bcrypt"); //para encriptar passwords
const express = require("express"); //para desarrollar la app
const cors = require("cors"); //para decir quien puede usar la api y quien no
const app = express();
const corsOptions = {  // aun no lo se
  origin: "http://localhost:3000",
};
const usersFile = "./dataBase.json";

const users = require(usersFile);
const secret = "lo que quieras";

// FUNCTIONS
const createToken = (userId) => {
  const userInfo = {
    id: userId,
  };
  const token = jwt.sign(userInfo, secret, { expiresIn: "1h" });
  return token;
};
const checkToken = (request, response, next) => {
  const auth = request.header("Authorization");
  const token = auth.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, secret);
    request.user = decodedToken;
    next();
  } catch (err) {
    response.status(401).json({ message: "You shall not pass!!" });
  }
};
const saveUsers = (arr) => {
  const text = JSON.stringify(arr, null, 4);
  fs.writeFileSync(usersFile, text);
};
const signupFunction = (request, response) => {
  const newUser = request.body;
  const sameEmailUser = users.find((u) => u.email === newUser.email);
  if (sameEmailUser) {
    return response
      .status(400)
      .json({ error: `user with email ${newUser.email} already exists` });
  }
  newUser.id = users.length + 1;
  const salt = bcrypt.genSaltSync(10);
  newUser.password = bcrypt.hashSync(newUser.password, salt);
  users.push(newUser);
  saveUsers(users);

  const token = createToken(newUser.id);

  return response.status(201).json({ jwtToken: token, isAuthenticated: true });
};
const getFriendsFunction = (request, response) => {
  const userId = parseInt(request.user.id);
  const user = users.find((u) => u.id === userId);
  if (user) {
    return response.status(200).json(user.friends);
  } else {
    return response
      .status(404)
      .json({ message: `user with id: ${userId} does not exist` });
  }
};

// MIDDLEWARES
app.use(cors(corsOptions));
app.use(express.json());
app.post("/sign-up", signupFunction);
app.get("/friends", checkToken, getFriendsFunction);

const PORT = 4000;
app.listen(PORT, () => console.log(`SERVER READY AT PORT: ${PORT}`));