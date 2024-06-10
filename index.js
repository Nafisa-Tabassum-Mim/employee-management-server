const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        // 'https://volunteer-91281.web.app',
        // 'https://volunteer-91281.firebaseapp.com'
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gnbvncz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = (req, res, next) => {
    console.log("log info - ", req.method, req.url)
    next()
}

const verifyToken = (req, res, next) => {
    // console.log(req.cookies)
    const token = req?.cookies?.token;
    console.log('token in the middleware -', token);
    // no token available 
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access - no token' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}
const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('ProbizDB').collection('users')
        const paymentCollection = client.db('ProbizDB').collection('payment')
        const workCollection = client.db('ProbizDB').collection('works')
        const messageCollection = client.db('ProbizDB').collection('message')

        app.post('/jwt',logger, async (req, res) => {
            const user = req.body
            console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.cookie('token', token, cookieOption).send({ success: true })
        })
        

        app.post('/logout', async (req, res) => {
            const user = req.body
            console.log('logging out', user)
            res.clearCookie('token', { ...cookieOption, maxAge: 0 }).send({ success: true })
        })


        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            // console.log(query)
            const userExist = await userCollection.findOne(query)
            // console.log(userExist)
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

            // console.log(query)
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })


        app.get('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.findOne(query)
            res.send(result)
        })




        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            // Find the user
            const user = await userCollection.findOne(query);
            if (user.isVerified !== 'verified') {
                const updateVerifiedDoc = {
                    $set: {
                        isVerified: 'verified'
                    }
                };
                const result = await userCollection.updateOne(query, updateVerifiedDoc);
                res.send(result);
                return
            }
            else {
                const updateHRDoc = {
                    $set: {
                        designation: 'HR',
                        role: 'HR'
                    }
                };
                const result = await userCollection.updateOne(query, updateHRDoc);
                res.send(result);
                return
            }
        });

        app.get('/users/fire/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.findOne(query)
            res.send(result)
        })
        app.patch('/users/fire/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updateFireDoc = {
                $set: {
                    isFired: 'Fired',
                }
            };
            const result = await userCollection.updateOne(query, updateFireDoc);
            res.send(result);
        });
        
        app.get('/users/salary/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.findOne(query)
            res.send(result)
        })
        app.patch('/users/salary/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const { salary } = req.body; // Destructure the salary from the request body
            const updateSalaryDoc = {
                $set: {
                    salary: parseFloat(salary) // Ensure salary is parsed as a float
                }
            };
            const result = await userCollection.updateOne(query, updateSalaryDoc);
            res.send(result);
        });

        app.post('/payment', async (req, res) => {
            const userInfo = req.body
            const result = await paymentCollection.insertOne(userInfo)
            res.send(result)
        })
        app.get('/payment', async (req, res) => {
            const email = req.query.email; // Correctly get the email from query parameters

            let query = {}
            if (email) {
                query = { email: email };
            }
            console.log('queryyyyyy', query)

            const result = await paymentCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { payId: id };  // Use id directly for matching payId
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/works', async (req, res) => {
            const workInfo = req.body
            const result = await workCollection.insertOne(workInfo)
            res.send(result)
        })

        app.get('/works', async (req, res) => {
            const email = req.query.email
            let query = {}
            if (email) {
                query = { email: email }
            }
            const result = await workCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/message', async (req, res) => {
            const messageInfo = req.body
            const result = await messageCollection.insertOne(messageInfo)
            res.send(result)
        })

        app.get('/message', async (req, res) => {
            const result = await messageCollection.find().toArray()
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