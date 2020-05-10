const DataLoader = require('dataloader');
const Event = require('../../models/event');
const User = require('../../models/user');
const { dateToString } = require('../../helpers/date');

// Use dataloader to batch data requests for schema types with nested queries

const eventLoader = new DataLoader((eventIds) => {
  return events(eventIds);
});

const userLoader = new DataLoader((userIds) => {
  return User.find({ _id: { $in: userIds } });
});

/** Max says this is a more flexible 'manual' population for db queries:
 * In addition to retrieving primitives, GraphQL can call functions in queries and 
 * return their results. This way also allows for more complex/compond queries that 
 * avoid possible infinite loops, because the functions aren't called unless that data
 * is specifically requested.
 * 
 * I wonder: is this up-to-date with the latest mongoose populate? 
 * See more recent comments in the YT video #7 on this.
 */

const events = async eventIds => {
  try {
    const events = await Event.find({ _id: { $in: eventIds } });
    return events.map(event => transformEvent(event));
  } catch (err) {
    throw err;
  }
};

const singleEvent = async eventId => {
  try {
    const event = await eventLoader.load(eventId.toString());
    // No need to transformEvent here, eventloader already does that by calling events.
    return event;
  } catch (err) {
    throw err;
  }
};

const user = async userId => {
  try {
    const user = await userLoader.load(userId.toString());
    return {
      ...user._doc, 
      createdEvents: () => eventLoader.loadMany(user._doc.createdEvents)
    };
  } catch (err) {
    throw err;
  }
};

/** If the retuned _id field throws an arror, override the original by:
 * converting it to a string, e.g.: return {...event._doc, _id: event._doc._id.toString() };
 * OR, using the id field added by mongoose, e.g.: return {...event._doc, _id: event.id };
 */
const transformEvent = event => ({
  ...event._doc, 
  _id: event.id,
  date: dateToString(event._doc.date), 
  // bind user function so that event._doc.creator is passed in as the arg
  creator: user.bind(this, event.creator) 
});

const transformBooking = booking => ({
  ...booking._doc, 
  _id: booking.id, 
  user: user.bind(this, booking._doc.user),
  event: singleEvent.bind(this, booking._doc.event),
  createdAt: dateToString(booking._doc.createdAt),
  updatedAt: dateToString(booking._doc.updatedAt) 
});

exports.transformEvent = transformEvent;
exports.transformBooking = transformBooking;