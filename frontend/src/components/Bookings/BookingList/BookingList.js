import React from 'react';
import BookingItem from './BookingItem/BookingItem';
import './BookingList.css';

const bookingList = props => (
  <ul className="bookings__list">
    {props.bookings.map(booking => (
      <li key={booking._id} className="bookings__item">
        <div className="bookings__item-data">
          {booking.event.title} -{' '} {new Date(booking.createdAt).toLocaleDateString()}
        </div>
        <div className="bookings__item-actions">
          <button className="btn" onClick={props.onDelete.bind(this, booking._id)}>Cancel</button>
        </div>
        
      </li>
      // <BookingItem booking={booking}/>
    ))}
  </ul>
);

export default bookingList;