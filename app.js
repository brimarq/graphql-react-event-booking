const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const { PORT, MONGODB_URI } = process.env;

const Event = require('./models/event');

const app = express();

const events = [];

app.use(express.json());

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return Event.find().then(events => {
        return events.map(event => {
          return {...event._doc};
          // If the _id field throws an arror, override the original by converting it to a string:
          // return {...event._doc, _id: event._doc._id.toString() };
          // Or, use the id field added by mongoose:
          // return {...event._doc, _id: event.id };

        });
      }).catch(err => { throw err; });
    },
    createEvent: (args) => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date)
      });
      return event
        .save()
        .then(result => {
          console.log(result);
          return {...result._doc};
          // If the _id field throws an arror, override the original by converting it to a string:
          // return {...event._doc, _id: event._doc._id.toString() };
          // Or, use the id field added by mongoose:
          // return {...event._doc, _id: event.id };
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    }
  },
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

