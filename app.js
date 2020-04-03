const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const { PORT, MONGODB_URI } = process.env;
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();


app.use(express.json());

/** More flexible 'manual' population for db queries:
 * In addition to retrieving primitives, GraphQL can call functions in queries and 
 * return their results. This way also allows for more complex/compond queries that 
 * avoid possible infinite loops, because the functions aren't called unless that data
 * is specifically requested.
 */

const events = eventIds => {
  return Event
    .find({ _id: { $in: eventIds } })
    .then(events => {
      return events.map(event => {
        return {...event._doc, creator: user.bind(this, event.creator) };
        /** If the retuned _id field throws an arror, override the original by:
         * converting it to a string, e.g.: return {...event._doc, _id: event._doc._id.toString() };
         * OR, using the id field added by mongoose, e.g.: return {...event._doc, _id: event.id };
         */
        // return {...event._doc, _id: event.id, creator: user.bind(this, event.creator) };
      })
    })
    .catch(errr => {
      throw err;
    })
};

const user = userId => {
  return User
    .findById(userId)
    .then(user => {
      return {...user._doc, createdEvents: events.bind(this, user._doc.createdEvents) };
      /** If the retuned _id field throws an arror, override the original by:
       * converting it to a string, e.g.: return {...user._doc, _id: user._doc._id.toString() };
       * OR, using the id field added by mongoose, e.g.: return {...user._doc, _id: user.id };
       */
      // return {...user._doc, _id: user.id, createdEvents: events.bind(this, user._doc.createdEvents) };
    })
    .catch(err => {
      throw err;
    })
};

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
      creator: User!
    }

    type User {
      _id: ID!
      email: String!
      # password is nullable here - don't want to retrieve it in queries
      password: String
      createdEvents: [Event!]
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      # Must require a password here
      password: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {
      // Always `return` if async so graphql knows to wait for promise to resolve
      return Event
        .find()
        .then(events => {
          return events.map(event => {
            // return {...event._doc}; 
            return {
              ...event._doc,
              _id: event.id,
              // bind user func (from above) so that event._doc.creator is passed in as the arg
              creator: user.bind(this, event._doc.creator)
            };
          });
        })
        .catch(err => { 
          throw err; 
        });
    },
    createEvent: (args) => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '5e868aab8197c91a08815bfa'
      });
      let createdEvent;
      // Always `return` if async so graphql knows to wait for promise to resolve
      return event
        .save()
        .then(result => {
          createdEvent = {...result._doc, _id: result.id, creator: user.bind(this, result._doc.creator) };
          return User.findById('5e868aab8197c91a08815bfa');
        })
        .then(user => {
          if (!user) {
            throw new Error('User not found.');
          }
          user.createdEvents.push(event);
          return user.save();
        })
        .then(result => {
          return createdEvent;
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    },
    createUser: (args) => {
      // Check if user exists, otherwise, create user
      // Always `return` if async so graphql knows to wait for promise to resolve
      return User.findOne({ email: args.userInput.email })
        .then(user => {
          if (user) {
            throw new Error('User exists already.');
          }
          return bcrypt.hash(args.userInput.password, 12);
        })
        .then(hashedPassword => {
          const user = new User({
            email: args.userInput.email,
            password: hashedPassword
          });
          return user.save();
        })
        .then(result => {
          // After saving user, nullify the returned password field
          return { ...result._doc, password: null, _id: result.id };
        })
        .catch(err => {
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

