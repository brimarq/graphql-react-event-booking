const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Booking {
    _id: ID!
    event: Event!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

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
    bookings: [Booking!]
  }

  type RootMutation {
    createEvent(eventInput: EventInput): Event
    createUser(userInput: UserInput): User
    bookEvent(eventId: ID!) : Booking!
    cancelBooking(bookingId: ID!): Event!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`)