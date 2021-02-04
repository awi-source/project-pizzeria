import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(wrapper){
    const thisBooking = this;

    thisBooking.render(wrapper);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.bookTable();
    thisBooking.onFormSubmitHandler();
    thisBooking.starterSupport();
    thisBooking.showColors();

    // thisBooking.dom.wrapper = wrapper;
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking:[
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('getData params', params);

    const urls = {
      booking:      settings.db.url + '/' + settings.db.booking
                                    + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?'
                                    + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?'
                                    + params.eventsRepeat.join('&'),
    };
    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  starterSupport(){
    const thisBooking = this;
    thisBooking.starters = {
      water: false,
      bread: false
    };
    const starterInputs = document.querySelectorAll('input[name="starter"]');
    // console.log(starterInputs);
    for (let starterInput of starterInputs) {
      starterInput.addEventListener('click', function (evt) {
        thisBooking.starters[evt.target.getAttribute('value')] = evt.target.checked;
      });
 
    }
  }
  
  // starterSupport(){
  //   const thisBooking = this;
  //   thisBooking.starters = [];
  //   const starterInputs = document.querySelectorAll('input[name="starter"]');
  //   for(let starterInput of starterInputs){
  //     starterInput.addEventListener('click', function(){
  //       let chosenStarter = starterInput;
  //       console.log(chosenStarter);
  //       thisBooking.starters.push(chosenStarter.value);
  //     });
  //   }
  // }
  
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    // console.log('------');
    console.log(thisBooking.booked);

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      // console.log(thisBooking.makeBooked(item.date, item.hour, item.duration, item.table));
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat === 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();

  }

  onFormSubmitHandler(){
    const thisBooking = this;
    // console.log(this);
    const submitForm = thisBooking.dom.wrapper.querySelector('.booking-form');
    // console.log(submitForm);
    submitForm.addEventListener('submit', function(e){
      e.preventDefault();
      // console.log('check this out');
      thisBooking.sendBooking();
    });
  }


  
  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
      // console.log(thisBooking.booked[date]);
    }

    const startHour = utils.hourToNumber(hour);


    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      // console.log('loop', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] === 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
      // console.log(hourBlock);
      // console.log(thisBooking.booked[date][hourBlock]);
      // console.log(thisBooking.booked[date][hourBlock].length);
     
    
    }
   
   
  }
 

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] === 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'
    ){
      allAvailable = true;
    }
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
        // console.log(table);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
  
    }
    
  }

  showColors() {
    const thisBooking = this;
    let gradient='';
    setTimeout(() => {
      for (let x = 12; x < 24; x = x + 0.5) {
        let color = 'rgba(63,223,34,1)';
        const booked = thisBooking.booked[thisBooking.date][x];
        if (booked&& booked.length < 2) {
          color = 'rgba(248,253,29,1)';
        }
        if (booked && (booked.length > 1)) {
          color = 'rgba(176,19,19,1)';
        }
        const counter = x -12;
        const start = parseInt(counter * 8.3);
        const end = parseInt((counter+ 0.5 )*8.3);
        gradient =  gradient + `${color} ${start}% ${end}%,`;
        const gradient2 = gradient.substring(0, gradient.length - 1);
        console.log(gradient2);
        
        console.log(gradient);
        console.log(`linear-gradient(90deg, ${gradient})`);
        const sliderBackground = document.querySelector('.rangeSlider');
        const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

        sliderBackground.style.background = `linear-gradient(90deg, ${gradient2})`; 
        // sliderBackground.style.background = `linear-gradient(90deg, rgba(221,102,43,1) 0% 4%, rgba(221,102,43,1) 4% 8%, rgba(176,19,19,1) 8% 12%, rgba(176,19,19,1) 12% 16%, rgba(221,102,43,1) 16% 20%, rgba(221,102,43,1) 20% 24%, rgba(221,102,43,1) 24% 29%, rgba(221,102,43,1) 29% 33%, rgba(176,19,19,1) 33% 37%, rgba(176,19,19,1) 37% 41%, rgba(221,102,43,1) 41% 45%, rgba(221,102,43,1) 45% 49%, rgba(221,102,43,1) 49% 53%, rgba(221,102,43,1) 53% 58%, rgba(221,102,43,1) 58% 62%, rgba(221,102,43,1) 62% 66%, rgba(63,223,34,1) 66% 70%, rgba(63,223,34,1) 70% 74%, rgba(63,223,34,1) 74% 78%, rgba(63,223,34,1) 78% 83%, rgba(63,223,34,1) 83% 87%, rgba(63,223,34,1) 87% 91%, rgba(63,223,34,1) 91% 95%, rgba(63,223,34,1) 95% 99%)`;

        beforeSliderBackground.style.background = 'transparent';

      }
    }, 1000);
    
  }
        
    


  // gradient = gradient+ `${color} ${start}%, ${color} ${end}%, `;
  // var gradient2 = gradient.substring(0, gradient.length - 1);
  // const css =`background:linear-gradient(90deg,${gradient2} );`;
  // console.log(css);
      
  // const gradient =  `${color} ${start}% ${end}%, `;
        
  // console.log(gradient);


  // }

  // const sliderBackground = document.querySelector('.rangeSlider');
  // const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

  // sliderBackground.style.background = `linear-gradient(90deg, ${gradient})`; 

  // beforeSliderBackground.style.background = 'transparent';
  // const sliderBackground = document.querySelector('.rangeSlider');
  // const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

  // sliderBackground.style.background = `linear-gradient(90deg, ${gradient})`; 

  // beforeSliderBackground.style.background = 'transparent';
      
  // }, 1000);
    
  //   const sliderBackground = document.querySelector('.rangeSlider');
  //   const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

  //   sliderBackground.style.background = `linear-gradient(90deg, ${gradient})`; 

  //   beforeSliderBackground.style.background = 'transparent';
    
  // }
    

  // const sliderBackground = document.querySelector('.rangeSlider');
  // // const beforeSliderBackground = document.querySelector('.rangeSlider_fill')
  // // sliderBackground.style.backgroundColor = 'red';
  // const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

  // sliderBackground.style.background = 'linear-gradient(90deg, green 8.33%, red 8.33% 16.66%, yellow 16.66% 24.99%, green 24.99% 33.32%, red 33.32% 41.65%, green 41.65% 49.98%, yellow 49.98% 58.31%, red 58.31% 64.64%,green 64.64% 74.97%, yellow 74.97% 83.30%, red 83.30% 91.63%, green 91.63%)'; 

  // beforeSliderBackground.style.background = 'transparent';

  // thisBooking.hours = [];
    
  // const date = thisBooking.datePicker.value;

  // for(let hourBlock in thisBooking.booked[date]){
  //   if(thisBooking.booked[date][hourBlock].length === 3){
  //     thisBooking.hours.push(`${hourBlock}: red`);
  //   }else if(thisBooking.booked[date][hourBlock].length === 2){
  //     thisBooking.hours.push(`${hourBlock}: yellow`);
  //   } else{
  //     thisBooking.hours.push(`${hourBlock}: green`);
  //   }
  // }
  // console.log(thisBooking.hours);

  // const date = thisBooking.datePicker.value;
  // const NumberOfTablesBooked = thisBooking.booked;
  // console.log(NumberOfTablesBooked);
  // for(let hourBlock of thisBooking.booked[date][hourBlock]){
  //   if(thisBooking.NumberOfTablesBooked === 3){
  //     sliderBackground.style.backgroundColor = 'red';
  //     beforeSliderBackground.style.backgroundColor = 'red';
  //   } else if(thisBooking.NumberOfTablesBooked === 2){
  //     sliderBackground.style.backgroundColor = 'yellow'; 
  //     beforeSliderBackground.style.backgroundColor = 'yellow';
  //   } else{
  //     sliderBackground.style.backgroundColor = 'green'; 
  //     beforeSliderBackground.style.backgroundColor = 'green';
  //   }
  // }

  


  bookTable(){
    const thisBooking = this;
    for(let table of thisBooking.dom.tables){
      if(!table.classList.contains(classNames.booking.tableBooked)){
        table.addEventListener('click', function(){
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.bookedTableId = parseInt(tableId);
          // console.log(`----> You have booked table ${tableId}`);
          table.classList.add(classNames.booking.tableBooked);
          // console.log(tableId);
        });
      }
    }
  }

 


  render(wrapper){
    const thisBooking = this;

    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;

    wrapper.innerHTML = generateHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    // console.log(wrapper);

    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    // console.log(wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    // thisBooking.dom.tables = thisBooking.wrapper.querySelectorAll(select.booking.tables);
    // console.log(thisBooking.dom.tables);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('input[name="address"]');
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('input[name="phone"]');

  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

  }
  //new code
  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
   

    // console.log(thisBooking.hourPicker);

    
    const payload = {
      date: thisBooking.datePicker.value,
      hour:thisBooking.hourPicker.value,
      table: thisBooking.bookedTableId,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl:  thisBooking.peopleAmount.value, 
      // starters: [],
      starters: thisBooking.starters,
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };

    console.log('payload', payload);
    console.log(thisBooking.booked);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse ', parsedResponse);
      });
  }
}



export default Booking;
