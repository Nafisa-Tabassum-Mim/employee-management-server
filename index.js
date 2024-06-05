const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config();


// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gnbvncz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('ProbizDB').collection('users')
        const paymentCollection = client.db('ProbizDB').collection('payment')

        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            console.log(query)
            const userExist = await userCollection.findOne(query)
            console.log(userExist)
            if (userExist) {
                return res.send({ message: 'user already exist' })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })


        app.get('/users', async (req, res) => {
            const email = req.query.email
            const role = req.query.role
            let query = {}

            if (email) {
                query = { email: email }
            }

            if (role) {
                query = { role: role }
            }

            console.log(query)
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        
        app.get('/users/:id',async(req,res)=>{
            const id= req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await userCollection.findOne(query)
            res.send(result)
        })

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            // extra i want to just do it. if it's admin then remove it. if it's not admin then make admin.
            const user = await userCollection.findOne(query)
            // console.log(user.role)
            // const newVerification = user.isVerified === 'verified'
            const updateDoc = {
                $set: {
                    isVerified: 'verified'
                }
            };
            const result = await userCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        app.post('/payment', async (req, res) => {
            const userInfo = req.body
            const result = await paymentCollection.insertOne(userInfo)
            res.send(result)
        })
        app.get('/payment', async (req, res) => {
            const result = await paymentCollection.find().toArray()
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('management is working')
})

app.listen(port, () => {
    console.log(`management is working on port ${port}`)
})