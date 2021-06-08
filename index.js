// Import express
let express = require('express');
// Import Mongoose
let mongoose = require('mongoose');
// Initialise the app
let app = express();
// Import CORS
var cors = require('cors');
// Use CORS for cross-origin API consumption.
app.use(cors());

// Import routes
let apiRoutes = require("./api-routes");
// Configure bodyparser to handle post requests
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
// Connect to Mongoose and set connection variable
mongoose.connect('mongodb://localhost/metriq', { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;

// Added check for DB connection
if(!db)
    console.log("Error connecting db")
else
    console.log("Db connected successfully")

// Setup server port
var port = process.env.PORT || 8080;

// Send message for default URL
app.get('/', (req, res) => res.send('Hello World with Express'));

// Use Api routes in the App
app.use('/api', apiRoutes);
// Launch app to listen to specified port
app.listen(port, function () {
    console.log("Running RestHub on port " + port);
});