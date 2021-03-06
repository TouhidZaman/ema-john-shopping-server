const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.au31u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("emaJohnDB").collection("products");

        //////////////////////////////////
        // Find Operations
        //////////////////////////////////

        //Getting products using search query
        app.get("/products", async (req, res) => {
            let query = {}; //Optimization needed

            //To search products using products name
            if (req.query.name) {
                // query = {name: req.query.name} // Only gives result for exact match
                const cursor = productsCollection.find(query);
                const products = await cursor.toArray();
                const searchText = req.query.name.toLowerCase();
                const filteredProducts = products.filter((product) =>
                    product.name.toLowerCase().includes(searchText)
                );
                res.send(filteredProducts);
            }
            //To get products by productsPerPage for pagination
            else if (req.query.productsPerPage || req.query.currentPage) {
                const productsPerPage = parseInt(req.query.productsPerPage);
                const currentPage = parseInt(req.query.currentPage);
                // console.log("products:", productsPerPage, "currentPage:", currentPage);
                const cursor = productsCollection
                    .find(query)
                    .skip(currentPage * productsPerPage)
                    .limit(productsPerPage);
                const products = await cursor.toArray();
                res.send(products);
            }
            //To get all products
            else {
                const cursor = productsCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
        });

        //Getting a single product using id parameter
        app.get("/product/:id", async (req, res) => {
            const productId = req.params.id;
            const query = { _id: ObjectId(productId) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });

        //To get products count
        app.get("/productsCount", async (req, res) => {
            const query = {};
            const productsPerPage = parseInt(req.query.productsPerPage);
            const countProducts = await productsCollection.countDocuments(query);
            const pagesCount = Math.ceil(countProducts / productsPerPage);
            res.send({ pagesCount });
        });

        //////////////////////////////////
        // Insert Operations
        //////////////////////////////////

        //Adding single product
        app.post("/product", async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result); // will return insertedId
        });

        //Adding multiple products
        app.post("/products", async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertMany(products);
            res.send(result); //will return insertedCount, insertedIds
        });

        //////////////////////////////////
        // Update Operations
        //////////////////////////////////

        //Updating a product
        app.put("/product/:id", async (req, res) => {
            const productId = req.params.id;
            const filter = { _id: ObjectId(productId) }; //Finding existing product using id

            //formatting updated product
            const updatedProduct = req.body;
            const updateDoc = {
                $set: {
                    ...updatedProduct,
                },
            };

            const options = { upsert: true }; //update option (update/insert)

            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //////////////////////////////////
        // Delete Operations
        //////////////////////////////////

        //Deleting a product
        app.delete("/product/:id", async (req, res) => {
            const productId = req.params.id;
            const query = { _id: ObjectId(productId) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });
    } finally {
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("ema-john-shopping-server");
});

app.listen(port, () => {
    console.log("listening to port", port);
});
