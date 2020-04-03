const express = require('express');
const { PORT, MONGODB_URI } = process.env;
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');

const graphqlSchema = require('./graphql/schema/index');
const graphqlResolvers = require('./graphql/resolvers/index');

const app = express();

app.use(express.json());

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
    app.listen(PORT || 3000, function () { 
      console.log(`Listening on port ${this.address().port}`);
    });
  })
  .catch(err => {
    console.log(err);
  });
