// create folder - open it in VSc, in terminal type - npm init, enter enter .... finally press y
// npm install express (package.json are created)
// create index.js file .. bcz  in package.json -"main": "index.js"
// type code in index.js.... to start , node index.js

const express = require("express"); // express its package, we use npm install express. so we requireing that
const cors = require("cors");
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const app = express(); // initiating,stored in a variable
// const URL = "mongodb://localhost:27017";
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
//use means - Midleware
app.use(
  cors({
    // origin: "http://localhost:3000",
    origin: "https://elegant-pie-c125eb.netlify.app",
  })
);

app.use(express.json()); // if we removed this line , req.body not works

let authorize = (req, res, next) => {
  try {
    //midleware
    //next means- its pass to next process ,otherwise its stoped here
    // check if authrization token present
    // console.log(req.headers  )
    if (req.headers.authorization) {
      //check if the token is valid
      let decodedToken = jwt.verify(req.headers.authorization, JWT_SECRET);
      if (decodedToken) {
        next();
      } else {
        res.status(401).json({ message: "Unathorized" });
      }
      // if valid say next()
      //if not valid say unathorized
    }
  } catch (error) {
    res.status(401).json({ message: "Unathorized" });
  }
};

let products = [];

app.post("/user/register", async (req, res) => {
  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL); // => its giving promise so we use async await and try catch

    // *** select the db
    const db = connection.db("trail");

    //harh the password
    var salt = await bcrypt.genSalt(10); //$2a$10$CchhhyhC97/ULkRGN66iUO -it is salt generating, 10 is complexcity of salt
    var hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;

    // *** select collection
    // *** do operation (CRUD)
    const user = await db.collection("users").insertOne(req.body);
    await connection.close();

    res.json({ message: "User created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});
app.post("/user/login", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("trail");
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });

    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        //Issue Token
        const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
          expiresIn: "9m",
        });
        res.json({ message: "success", token });
      } else {
        res.json({ message: "incorrect username/password" });
      }
    } else {
      res.status(404).json({ message: "incorrect username/password" });
    }
  } catch (error) {}
});

//Create
app.post("/product", authorize, async (req, res) => {
  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL); // => its giving promise so we use async await and try catch

    // *** select the db
    const db = connection.db("trail");

    // *** select collection
    // *** do operation (CRUD)
    const product = await db.collection("products").insertOne(req.body);

    // *** close the connection
    await connection.close();

    res.json({ message: "product created", id: product.insertedId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//Read
app.get("/products",  async (req, res) => {
  // res.json(products)
  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL);
    // *** select the db
    const db = connection.db("trail");
    // *** select collection
    // *** do operation (CRUD)
    const product = await db.collection("products").find().toArray(); //=> toarray - to get orginal array data. before that we get cruzer memory/referal date

    // *** close the connection
    await connection.close();

    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//Update - URL paramrter
app.put("/product/:productId", authorize, async (req, res) => {
  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL);
    // *** select the db
    const db = connection.db("trail");

    const productData = await db
      .collection("products")
      .findOne({ _id: mongodb.ObjectId(req.params.productId) });
    if (productData) {
      delete req.body._id;
      // *** select collection
      // *** do operation (CRUD)
      const product = await db
        .collection("products")
        .updateOne(
          { _id: mongodb.ObjectId(req.params.productId) },
          { $set: req.body }
        ); //=>updateOne - first parameter is filter, second parameter is update

      // *** close the connection
      await connection.close();

      res.json(product);
    } else {
      res.status(404).json({ message: "product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }

  //     const productId = req.params.productId;

  //     const productIndex = products.findIndex((prod) => prod.id == productId) // 3 === "3" - false

  //     // products[productIndex].price = req.body.price
  // if (productIndex !=-1) {
  //     const keys = Object.keys(req.body) // Object.keys, help to get key word in array

  //     keys.forEach((key)=>{
  //         products[productIndex][key] = req.body[key]
  //     })

  //         // console.log(productId)
  //         // console.log(req.body)
  //         res.json({message:"Done"})
  // } else {

  //     res.status(404).json({message:"product not found"})

  // }
});

app.get("/product/:productId", authorize, async (req, res) => {
  // const productId = req.params.productId;
  //  const productIndex = products.findIndex((prod) => prod.id == productId)
  //  res.json(products[productIndex])
  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL);
    // *** select the db
    const db = connection.db("trail");
    // *** select collection
    // *** do operation (CRUD)
    const product = await db
      .collection("products")
      .findOne({ _id: mongodb.ObjectId(req.params.productId) });
    //=>updateOne - first parameter is filter, second parameter is update
    await connection.close();

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "product not found" });
    }

    // *** close the connection
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.delete("/product/:productId", authorize, async (req, res) => {
  //   const productId = req.params.productId;
  //   const productIndex = products.findIndex((prod) => prod.id == productId);
  //   products.splice(productIndex, 1);
  //   res.json({ message: "Deleted" });

  try {
    // *** connect the Database
    const connection = await mongoclient.connect(URL);
    // *** select the db
    const db = connection.db("trail");

    const productData = await db
      .collection("products")
      .findOne({ _id: mongodb.ObjectId(req.params.productId) });
    if (productData) {
      // *** select collection
      // *** do operation (CRUD)
      const product = await db
        .collection("products")
        .deleteOne({ _id: mongodb.ObjectId(req.params.productId) });

      // *** close the connection
      await connection.close();
      res.json(product);
    } else {
      res.status(404).json({ message: "product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.listen(3006); //listening it
