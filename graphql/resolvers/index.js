const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');
const Booking = require('../../models/booking');
const { dateToString } = require('../../helpers/date');


/** If the retuned _id field throws an arror, override the original by:
 * converting it to a string, e.g.: return {...event._doc, _id: event._doc._id.toString() };
 * OR, using the id field added by mongoose, e.g.: return {...event._doc, _id: event.id };
 */
// return {...event._doc, _id: event.id, creator: user.bind(this, event.creator) };
const transformEvent = event => {
  return {
    ...event._doc, 
    _id: event.id,
    date: dateToString(event._doc.date), 
    // bind user function so that event._doc.creator is passed in as the arg
    creator: user.bind(this, event.creator) 
  };
};

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
    const event = await Event.findById(eventId);
    return transformEvent(event);
  } catch (err) {
    throw err;
  }
};

const user = async userId => {
  try {
    const user = await User.findById(userId);
    return {...user._doc, createdEvents: events.bind(this, user._doc.createdEvents) };
    /** If the retuned _id field throws an arror, override the original by:
     * converting it to a string, e.g.: return {...user._doc, _id: user._doc._id.toString() };
     * OR, using the id field added by mongoose, e.g.: return {...user._doc, _id: user.id };
     */
    // return {...user._doc, _id: user.id, createdEvents: events.bind(this, user._doc.createdEvents) };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  events: async () => {
    try {
      const events = await Event.find();
      return events.map(event => transformEvent(event));
    } catch (err) {
      throw err;
    }
  },
  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map(booking => {
        return { 
          ...booking._doc, 
          _id: booking.id, 
          user: user.bind(this, booking._doc.user),
          event: singleEvent.bind(this, booking._doc.event),
          createdAt: dateToString(booking._doc.createdAt),
          updatedAt: dateToString(booking._doc.updatedAt) 
        };
      })
    } catch(err) {
      throw err;
    }
  },
  createEvent: async args => {
    try {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '5e868aab8197c91a08815bfa'
      });

      let createdEvent;
      const result = await event.save();
      createdEvent = transformEvent(result);

      const creator = await User.findById('5e868aab8197c91a08815bfa');
      if (!creator) {
        throw new Error('User not found.');
      }
      creator.createdEvents.push(event);
      await creator.save();

      return createdEvent;

    } catch (err) {
      throw err;
    }
  },
  createUser: async args => {
    try {
      let user = await User.findOne({ email: args.userInput.email });
      if (user) {
        throw new Error('User exists already.');
      }

      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      user = new User({
        email: args.userInput.email,
        password: hashedPassword
      });

      const result = await user.save();
      return { ...result._doc, password: null, _id: result.id };

    } catch (err) {
      throw err;
    }
  },
  bookEvent: async args => {
    try {
      const fetchedEvent = await Event.findOne({ _id: args.eventId });
      const booking = new Booking({
        user: '5e868aab8197c91a08815bfa',
        event: fetchedEvent
      });
      const result = await booking.save();
      return { 
        ...result._doc, 
        _id: result.id, 
        user: user.bind(this, result._doc.user),
        event: singleEvent.bind(this, result._doc.event),
        createdAt: dateToString(result._doc.createdAt),
        updatedAt: dateToString(result._doc.updatedAt) 
      };
    } catch (err) { 
      throw err; 
    }
  },
  cancelBooking: async args => {
    try {
      const booking = await Booking.findById(args.bookingId).populate('event');
      const event = transformEvent(booking.event);
      await Booking.deleteOne({ _id: args.bookingId });
      return event;
    } catch (err) { 
      throw err; 
    }
  }
}

// try {} catch (err) { throw err; }