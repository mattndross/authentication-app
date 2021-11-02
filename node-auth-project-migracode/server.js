const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const corsOptions = {  //aun no lo se
  origin: "http://localhost:3000"
};
const dataBase = "./dataBase.json";
const users = require(dataBase);
const secret = "Papa Frita";

// FUNCTIONS
const saveUsers = (arr) => {
  const text = JSON.stringify(arr, null, 4);
  fs.writeFileSync(dataBase, text); //borra lo anterior y vuelve a escribir todo de nuevo?
};
const generateToken = (userId) => {
  const userInfo = {
    id : userId,
  };
  const token = jwt.sign(userInfo, secret, {expiresIn:"15m"});
  return token;
};
const signupFunction = (req, res) => {
  const newUser = req.body;
  console.log(newUser);
  if (newUser.email && newUser.password && newUser.name) {
    const emailIsUsed = users.find(u => u.email === newUser.email);
    if (emailIsUsed) {
      return res.status(400).send(`email ${user.email} is already used`)
    } else {
      newUser.id = users.length + 1;
      const salt = bcrypt.genSaltSync(10);
      newUser.password = bcrypt.hashSync(newUser.password, salt);
      users.push(newUser);
      saveUsers(users);

      const token = generateToken(newUser.id);

      return res.status(201).json({jwtoken: token, isAuthenticated : true})
    }
  } else {
    return res.status(400).send("bad request");
  }
};
const signInFunction = (req, res) => {
  const {email, password} = req.body;
  const validUser = users.find(u => u.email === email);
  if (!validUser) {
    return res.status(404).send(`not valid email or password.`);
  }   
  const validPassword = bcrypt.compareSync(password, validUser.password)
  if (!validPassword) {
    return res.status(404).send(`not valid email or password.`);
  }
  const jwtoken = generateToken(validUser.id);
  return res.status(200).json({jwtoken: jwtoken, isAuthenticated: true})
};
const checkToken = (req, res, next) => {
  const auth = req.header("Authorization");
  const token = auth.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, secret);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({error: error})
  }
}
const getFriendsFunction = (req, res) => {
  const userId = parseInt(req.user.id);
  const user = users.find(u => u.id === userId);
  if(user) {
    return res.status(200).json({friends: user.friends});
  } else {
    return res.status(404).send("user not found");
  };
};

//MIDDLEWEARS

app.use(express.json());
app.use(cors(corsOptions));  // enable CORS
app.get("/", (req, res) => {
  res.json({ message: "Welcome to MigraCode Auth application." });
});
app.get("/dataBase", (req, res) => {
  res.json({"dataBase": users})
})
app.get("/friends", checkToken, getFriendsFunction)
app.post("/user/sign-up", signupFunction);
app.post("/user/sign-in", signInFunction);


// set port, listen for requests
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});