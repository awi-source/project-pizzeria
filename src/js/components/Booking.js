import {templates, select} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

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
  

    thisBooking.dom.hoursAmount = wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.hourPicker = wrapper.querySelector(select.widgets.hourPicker.wrapper);

  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
  }
}

export default Booking;