const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express() 
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.gny4dya.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT =(req, res, next)=>{
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.send(401).send({error: true, message: 'unauthorize access'})
  }
  const token =authorization.split(' ')[1]
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded)=>{
    if(error){
      return res.status(403).send({error: true, message: 'unauthorised access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('bookings')

//JWT USE
app.post('/jwt', (req, res)=>{
  const user = req.body;
  console.log(user);
  const token= jwt.sign(user, process.env.ACCESS_TOKEN,{
expiresIn: '1h'})
res.send({token})
})
    //all data load
    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find();
        const result =await cursor.toArray()
        res.send(result)
    })

    // one data load
    app.get('/services/:id', async(req, res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const options = {
          // Include only the `title` and `imdb` fields in the returned document 0= not send 1= send
          projection: { _id: 1, title: 1, title: 1 , price: 1, img: 1, description: 1,},
        };
        const result = await serviceCollection.findOne(query, options)
        res.send(result)
    })


//bookings post from ui
app.post('/bookings', async(req, res)=>{
  const booking = req.body;
  const result = await bookingCollection.insertOne(booking)
  res.send(result)
})

//booking data show & delete
app.delete('/bookings/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await bookingCollection.deleteOne(query)
  res.send(result)
})
app.patch('/bookings/:id', async(req, res)=>{
  const id= req.params.id;
  const filter ={ _id: new ObjectId(id)}
  const updatedBooking = req.body;
  const updateDoc={
    $set:{
      status: updatedBooking.status
    }
  }
  const result = await bookingCollection.updateOne(filter, updateDoc)
  res.send(result)
})

//some data show
//sitename/bookings?email=email@email.com this url search
app.get('/bookings', verifyJWT, async(req, res)=>{
  const decoded = req.decoded;
  if(decoded.email !==req.query.email){
    return res.status(403).send({error:1, message: 'forbidden access'})
  }
  let query ={}
  if(req.query?.email){
    query= {email:req.query.email}
  }
  const result = await bookingCollection.find(query).toArray()
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
  res.send('car doctors server running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})