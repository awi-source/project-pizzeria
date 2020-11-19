import {templates, select} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(wrapper){
    const thisBooking = this;

    thisBooking.render(wrapper);
    thisBooking.initWidgets(); 

    thisBooking.dom.wrapper = wrapper;
  }
  render(wrapper){
    const thisBooking = this;

    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
 
    wrapper.innerHTML = generateHTML;
    
    thisBooking.dom.peopleAmount = wrapper.querySelector(select.booking.peopleAmount);
    console.log(thisBooking.dom.peopleAmount);
    console.log(thisBooking.dom);

    thisBooking.dom.hoursAmount = wrapper.querySelector(select.booking.hoursAmount);

  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}

export default Booking;