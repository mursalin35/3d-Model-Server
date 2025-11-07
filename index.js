const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();
const serviceAccount = require("./firebase-admin-key.json");
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vx3mlx4.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleWere
const verifyFirebaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "unauthorized access token not found " });
  }

  const token = authorization.split(" ")[1];
  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).send({ message: "unauthorized access" });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("modelDB");
    const modelCollection = db.collection("models");
    const downloadCollection = db.collection("downloads");

    // find
    app.get("/models", async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result);
    });

    // findOne
    app.get("/models/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;
      const result = await modelCollection.findOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        result,
      });
    });

    // post method
    // insertOne
    // insertMany
    app.post("/models", async (req, res) => {
      const data = req.body;
      const result = await modelCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // PUT
    // updateOne
    // updateMany
    app.put("/models/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };
      const result = await modelCollection.updateOne(filter, update);

      res.send({
        success: true,
        result,
      });
    });

    // delete
    // deleteOne
    // deleteMany
    app.delete("/models/:id", async (req, res) => {
      const { id } = req.params;
      //   const objectId = new ObjectId(id);
      //   const filter = { _id: objectId };
      const result = await modelCollection.deleteOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
        result,
      });
    });

    // latest 6 data
    // get
    // find
    app.get("/latest-models", async (req, res) => {
      const result = await modelCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // My Models
    app.get("/my-models", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await modelCollection
        .find({ created_by: email })
        .toArray();
      res.send(result);
    });

    // my download db add
    app.post("/downloads", async (req, res) => {
      const data = req.body;
      const result = await downloadCollection.insertOne(data);

      const filter = {_id: new ObjectId(data._id)}
      const update = {
        $inc:{
          downloads: 1
        }
      }
      const downloadCounted = await modelCollection.updateOne(filter, update)
      res.send(result,  downloadCounted);
    });
    // my download db get
    app.get("/my-downloads", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await downloadCollection
        .find({ downloaded_by: email })
        .toArray();
      res.send(result);
    });

    // .............................................MongoClient.EventEmitter..................
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("3d server is running!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
