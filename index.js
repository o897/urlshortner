require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const shortId = require('shortid');
const bodyParser = require('body-parser');

const validUrl = require('valid-url');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env['MONGO_DB'], {
  useNewUrlParser: true, useUnifiedTopology: true, writeConcern: { w: 'majority' },
})
  .then(() => {
    console.log("Connected successfully to the DB.");
  })
  .catch((err) => {
    console.log("Error connecting to MONGODB: " + err)
  });

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: String
});


const UrlModel = mongoose.model('url', urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  
  let original_url, short_url;
  original_url = req.body.url;
  short_url = shortId.generate();

  // if user provides an invalid url return error
  if (!validUrl.isWebUri(original_url)) {
    return res.json({ error: 'invalid url' });
  }

  // Save data to the DB
  try {
    
    const newUrl = new UrlModel({
      original_url: original_url,
      short_url: short_url
    });

    newUrl.save();

  } catch (err) {
    console.log(err);
  }

  res.json({original_url, short_url});

});

// it make take some time to get the data
app.get('/api/shorturl/:short_url', async function(req, res) {

  try {
    const short_url = req.params.short_url;
    
    // wait for the result
    const findUrl = await UrlModel.findOne({ short_url: short_url });

    // if short url is found redirect to the original url
    if (findUrl) {
      res.redirect(findUrl.original_url);
    } else {
      return res.status(404).json('No URL found');
    }

  } catch (err) {
    console.log(err)
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
