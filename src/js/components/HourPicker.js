import BaseWidget from './BaseWidget.js';
import {settings, select} from '../settings.js';
import utils from '../utils.js';

class HourPicker extends BaseWidget {
  constructor(wrapper){
    super(wrapper, settings.hours.open);

    const thisWidget = this;
   
    thisWidget.dom.input = document.querySelector(select.widgets.hourPicker.input);
    console.log(thisWidget.dom.input);
    thisWidget.dom.output = document.querySelector(select.widgets.hourPicker.output);
    console.log(thisWidget.dom.output);

    thisWidget.initPlugin();
    thisWidget.value = thisWidget.dom.input.value;
    console.log(thisWidget.value);
   
  }

  initPlugin(){
    const thisWidget = this;
    rangeSlider.create(thisWidget.dom.input);
    thisWidget.dom.input.addEventListener('input', function(){
      thisWidget.value = thisWidget.dom.input.value;
      console.log(thisWidget.value);
    });
  }
  parseValue(value){
    const thisWidget = this;
    const parsedValue = utils.numberToHour(value);
    console.log(parsedValue);
    //  return parsedValue;
    thisWidget.dom.output.innerHTML = parsedValue;
    // return utils.numberToHour(value);
    
  }
  isValid(){
    return true;
  }
  renderValue(){
    // const thisWidget = this;
    // thisWidget.dom.output = thisWidget.value;
    // console.log(thisWidget.value);
  }

 

}

export default HourPicker;