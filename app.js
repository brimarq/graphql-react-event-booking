const express = require('express');
const { PORT, MONGODB_URI } = process.env;
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');

const graphqlSchema = require('./graphql/schema/index');
const graphqlResolvers = require('./graphql/resolvers/index');
const isAuth = require('./middleware/is-auth');

const app = express();

app.use(express.json());

// Set CORS policy
app.use((req, res, next) => {
  // Because this is an API, allow requests from anywhere.
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Browsers automatically send an OPTIONS req before a POST req, to see what options are available.
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Respond to OPTIONS req, which cannot be handled by the graphql endpoint
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(isAuth);

app.use('/graphql', graphqlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolvers,
  graphiql: true
}));

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Database connected');
    app.listen(PORT || 8000, function () { 
      console.log(`Listening on port ${this.address().port}`);
    });
  })
  .catch(err => {
    console.log(err);
  });
