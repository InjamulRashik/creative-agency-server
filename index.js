const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uv9mv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("services"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("Working");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const orders = client.db("creativeAgency").collection("orders");
  const services = client.db("creativeAgency").collection("services");
  const reviews = client.db("creativeAgency").collection("reviews");
  app.post("/addOrder", (req, res) => {
    const order = req.body;
    orders.insertOne(order).then((result) => {});
  });
  app.get("/allServicelist", (req, res) => {
    //console.log(req.query.email);
    orders.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.get("/servicelist", (req, res) => {
    //console.log(req.query.email);
    orders.find({ email: req.query.email }).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/addReview", (req, res) => {
    const review = req.body;
    console.log(review);
    reviews.insertOne(review).then((result) => {});
  });
  app.get("/reviews", (req, res) => {
    //console.log(req.query.email);
    reviews
      .find({})
      .sort({ _id: -1 })
      .limit(3)
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  app.post("/addService", (req, res) => {
    const file = req.files.file;

    const name = req.body.name;
    const description = req.body.description;
    const filePath = `${__dirname}/services/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ msg: "Failed to upload image" });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");

      var image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer(encImg, "base64"),
      };

      services.insertOne({ name, description, image }).then((result) => {
        fs.remove(filePath, (error) => {
          if (error) {
            console.log(error);
          }
        });
        res.send(result.insertedCount > 0);
      });
      // return res.send({ name: file.name, path: `${file.name}` });
    });
  });
  app.get("/services", (req, res) => {
    services
      .find({})
      .sort({ _id: -1 })
      .limit(3)
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  app.patch("/updateOrder", (req, res) => {
    orders
      .updateOne(
        { _id: ObjectId(req.body.id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then((result) => {
        res.send(result);
      });
  });
});

app.listen(process.env.PORT || port);
