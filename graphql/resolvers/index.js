const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');


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
    return events.map(event => {
      return {...event._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, event.creator) };
      /** If the retuned _id field throws an arror, override the original by:
       * converting it to a string, e.g.: return {...event._doc, _id: event._doc._id.toString() };
       * OR, using the id field added by mongoose, e.g.: return {...event._doc, _id: event.id };
       */
      // return {...event._doc, _id: event.id, creator: user.bind(this, event.creator) };
    });
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
      return events.map(event => {
        // return {...event._doc}; 
        return {
          ...event._doc,
          _id: event.id,
          date: new Date(event._doc.date).toISOString(),
          // bind user func (from above) so that event._doc.creator is passed in as the arg
          creator: user.bind(this, event._doc.creator)
        };
      });
    } catch (err) {
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
      createdEvent = {
        ...result._doc, 
        _id: result.id, 
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, result._doc.creator) 
      };

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
  }
}