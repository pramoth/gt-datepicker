/**
 * Created by pramoth on 10/27/2016 AD.
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {DomHandler} from './DomHandler';

export const CALENDAR_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CalendarComponent),
  multi: true
};

export interface LocaleSettings {
  firstDayOfWeek?: number;
  dayNames: string[];
  dayNamesShort: string[];
  dayNamesMin: string[];
  monthNames: string[];
  monthNamesShort: string[];
  yearOffset: number;
}

@Component({
  selector: 'gt-calendar',
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css'],
  animations: [
    trigger('overlayState', [
      state('hidden', style({
        opacity: 0
      })),
      state('visible', style({
        opacity: 1
      })),
      transition('visible => hidden', animate('400ms ease-in')),
      transition('hidden => visible', animate('400ms ease-out'))
    ])
  ],
  providers: [DomHandler, CALENDAR_VALUE_ACCESSOR]
})
export class CalendarComponent implements AfterViewInit, OnInit, OnDestroy, ControlValueAccessor {

  @Input() defaultDate: Date;

  @Input() style: string;

  @Input() styleClass: string;

  @Input() inputStyle: string;

  @Input() inputStyleClass: string;

  @Input() placeholder: string;

  @Input() disabled: any;

  @Input() dateFormat: string = 'd MM yy';

  @Input() inline: boolean = false;

  @Input() showOtherMonths: boolean = true;

  @Input() selectOtherMonths: boolean;

  @Input() showIcon: boolean;

  @Input() icon: string = 'fa fa-calendar';

  @Input() appendTo: any;

  @Input() readonlyInput: boolean;

  @Input() shortYearCutoff: any = '+10';

  @Input() minDate: Date;

  @Input() maxDate: Date;

  @Input() monthNavigator: boolean = true;

  @Input() yearNavigator: boolean = true;

  @Input() yearRange: string = '1920:2050';

  @Input() showTime: boolean;

  @Input() hourFormat: string = '24';

  @Input() timeOnly: boolean;

  @Output() onBlur: EventEmitter<any> = new EventEmitter();

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  @Input() locale: LocaleSettings = {
    firstDayOfWeek: 0,
    dayNames: ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'],
    dayNamesShort: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    dayNamesMin: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
    monthNames: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    //monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthNamesShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.	', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
    yearOffset: 543
  };

  value: Date;

  dates: any[];

  weekDays: string[] = [];

  currentMonthText: string;

  currentMonth: number;

  currentYear: number;

  currentHour: number;

  currentMinute: number;

  pm: boolean;

  overlay: HTMLDivElement;

  inputfield: HTMLInputElement;

  overlayVisible: boolean;

  closeOverlay: boolean = true;

  dateClick: boolean;

  onModelChange: Function = () => {
  };

  onModelTouched: Function = () => {
  };

  calendarElement: any;

  documentClickListener: any;

  ticksTo1970: number;

  yearOptions: number[];

  hoverNext: any;

  hoverPrev: any;

  hoverCell: any;

  constructor(protected el: ElementRef, protected domHandler: DomHandler, protected renderer: Renderer2) {
  }

  ngOnInit() {
    let today = new Date();
    let date = this.defaultDate || new Date();
    let dayIndex = this.locale.firstDayOfWeek;
    for (let i = 0; i < 7; i++) {
      this.weekDays.push(this.locale.dayNamesMin[dayIndex]);
      dayIndex = (dayIndex == 6) ? 0 : ++dayIndex;
    }

    this.currentMonth = date.getMonth();
    this.currentYear = date.getFullYear();
    if (this.showTime) {
      this.currentMinute = date.getMinutes();
      this.pm = date.getHours() > 11;

      if (this.hourFormat == '12')
        this.currentHour = date.getHours() == 0 ? 12 : date.getHours() % 12;
      else
        this.currentHour = date.getHours();
    }
    else if (this.timeOnly) {
      this.currentMinute = 0;
      this.currentHour = 0;
    }

    this.createMonth(this.currentMonth, this.currentYear);

    this.documentClickListener = this.renderer.listen('body', 'click', () => {
      if (this.closeOverlay) {
        this.overlayVisible = false;
      }

      this.closeOverlay = true;
      this.dateClick = false;
    });

    this.ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
      Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);

    if (this.yearNavigator && this.yearRange) {
      this.yearOptions = [];
      let years = this.yearRange.split(':'),
        yearStart = parseInt(years[0]),
        yearEnd = parseInt(years[1]);

      for (let i = yearStart; i <= yearEnd; i++) {
        this.yearOptions.push(i);
      }
    }
  }

  ngAfterViewInit() {
    this.overlay = this.domHandler.findSingle(this.el.nativeElement, '.ui-datepicker');

    if (!this.inline) {
      this.inputfield = this.el.nativeElement.children[0].children[0];
    }

    if (!this.inline && this.appendTo) {
      if (this.appendTo === 'body')
        document.body.appendChild(this.overlay);
      else
        this.appendTo.appendChild(this.overlay);
    }
  }

  createMonth(month: number, year: number) {
    this.dates = [];
    this.currentMonthText = this.locale.monthNames[month];
    this.currentYear = year;
    this.currentMonth = month;
    let firstDay = this.getFirstDayOfMonthIndex(month, year);
    let daysLength = this.getDaysCountInMonth(month, year);
    let prevMonthDaysLength = this.getDaysCountInPrevMonth(month, year);
    let sundayIndex = this.getSundayIndex();
    let dayNo = 1;

    for (let i = 0; i < 6; i++) {
      let week = [];

      if (i == 0) {
        for (let j = (prevMonthDaysLength - firstDay + 1); j <= prevMonthDaysLength; j++) {
          let prev = this.getPreviousMonthAndYear(month, year);
          week.push({
            day: j,
            month: prev.month,
            year: prev.year,
            otherMonth: true,
            selectable: this.isSelectable(j, prev.month, prev.year)
          });
        }

        let remainingDaysLength = 7 - week.length;
        for (let j = 0; j < remainingDaysLength; j++) {
          week.push({
            day: dayNo,
            month: month,
            year: year,
            selectable: this.isSelectable(dayNo, month, year)
          });
          dayNo++;
        }
      }
      else {
        for (let j = 0; j < 7; j++) {
          if (dayNo > daysLength) {
            let next = this.getPreviousMonthAndYear(month, year);
            week.push({
              day: dayNo - daysLength, month: next.month, year: next.year, otherMonth: true,
              selectable: this.isSelectable((dayNo - daysLength), next.month, next.year)
            });
          }
          else {
            week.push({
              day: dayNo,
              month: month,
              year: year,
              selectable: this.isSelectable(dayNo, month, year)
            });
          }

          dayNo++;
        }
      }

      this.dates.push(week);
    }
  }

  prevMonth(event) {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    else {
      this.currentMonth--;
    }

    this.createMonth(this.currentMonth, this.currentYear);
    event.preventDefault();
  }

  nextMonth(event) {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    else {
      this.currentMonth++;
    }

    this.createMonth(this.currentMonth, this.currentYear);
    event.preventDefault();
  }

  onDateSelect(event, dateMeta) {
    if (this.disabled || !dateMeta.selectable) {
      event.preventDefault();
      return;
    }

    if (dateMeta.otherMonth) {
      if (this.selectOtherMonths)
        this.selectDate(dateMeta);
    }
    else {
      this.selectDate(dateMeta);
    }

    this.dateClick = true;
    this.updateInputfield();
    event.preventDefault();
  }

  updateInputfield() {
    if (this.inputfield) {
      let formattedValue;

      if (this.timeOnly) {
        formattedValue = this.formatTime(this.value);
      }
      else {
        formattedValue = this.formatDate(this.value, this.dateFormat);
        if (this.showTime) {
          formattedValue += ' ' + this.formatTime(this.value);
        }
      }

      this.inputfield.value = formattedValue;
    }
  }

  selectDate(dateMeta) {
    this.value = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
    if (this.showTime) {
      if (this.hourFormat === '12' && this.pm && this.currentHour != 12)
        this.value.setHours(this.currentHour + 12);
      else
        this.value.setHours(this.currentHour);

      this.value.setMinutes(this.currentMinute);
    }
    this.onModelChange(this.value);
    this.onSelect.emit(this.value);
  }

  getFirstDayOfMonthIndex(month: number, year: number) {
    let day = new Date();
    day.setDate(1);
    day.setMonth(month);
    day.setFullYear(year);

    let dayIndex = day.getDay() + this.getSundayIndex();
    return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
  }

  getDaysCountInMonth(month: number, year: number) {
    return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
  }

  getDaysCountInPrevMonth(month: number, year: number) {
    let prev = this.getPreviousMonthAndYear(month, year);
    return this.getDaysCountInMonth(prev.month, prev.year);
  }

  getPreviousMonthAndYear(month: number, year: number) {
    let m, y;

    if (month === 0) {
      m = 11;
      y = year - 1;
    }
    else {
      m = month - 1;
      y = year;
    }

    return {'month': m, 'year': y};
  }

  getNextMonthAndYear(month: number, year: number) {
    let m, y;

    if (month === 11) {
      m = 0;
      y = year + 1;
    }
    else {
      m = month + 1;
    }

    return {'month': m, 'year': y};
  }

  getSundayIndex() {
    return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
  }

  isSelected(dateMeta): boolean {
    if (this.value && this.value['getDate'])
      return this.value.getDate() === dateMeta.day && this.value.getMonth() === dateMeta.month && this.value.getFullYear() === dateMeta.year;
    else
      return false;
  }

  isToday(dateMeta): boolean {
    let today = new Date();

    return today.getDate() === dateMeta.day && today.getMonth() === dateMeta.month && today.getFullYear() === dateMeta.year;
  }

  isSelectable(day, month, year): boolean {
    let validMin = true;
    let validMax = true;

    if (this.minDate) {
      if (this.minDate.getFullYear() > year) {
        validMin = false;
      }
      else if (this.minDate.getFullYear() === year) {
        if (this.minDate.getMonth() > month) {
          validMin = false;
        }
        else if (this.minDate.getMonth() === month) {
          if (this.minDate.getDate() > day) {
            validMin = false;
          }
        }
      }
    }

    if (this.maxDate) {
      if (this.maxDate.getFullYear() < year) {
        validMax = false;
      }
      else if (this.maxDate.getFullYear() === year) {
        if (this.maxDate.getMonth() < month) {
          validMax = false;
        }
        else if (this.maxDate.getMonth() === month) {
          if (this.maxDate.getDate() < day) {
            validMax = false;
          }
        }
      }
    }

    return validMin && validMax;
  }

  onInputFocus(event) {
    this.showOverlay(event);
  }

  onButtonClick(event) {
    this.closeOverlay = false;

    if (!this.overlay.offsetParent) {
      this.inputfield.focus();
    }
    else {
      this.closeOverlay = true;
    }
  }

  onInputKeydown(event) {
    if (event.keyCode === 9) {
      this.overlayVisible = false;
    }
  }

  onInputBlur(event) {
    this.onBlur.emit(event);
    this.onModelTouched();
  }

  onMonthDropdownChange(m: string) {
    this.currentMonth = parseInt(m);
    this.createMonth(this.currentMonth, this.currentYear);
  }

  onYearDropdownChange(y: string) {
    this.currentYear = parseInt(y);
    this.createMonth(this.currentMonth, this.currentYear);
  }

  incrementHour(event) {
    if (this.hourFormat == '24') {
      if (this.currentHour === 23)
        this.currentHour = 0;
      else
        this.currentHour++;
    }
    else if (this.hourFormat == '12') {
      if (this.currentHour === 12)
        this.currentHour = 0;
      else
        this.currentHour++;
    }

    this.updateTime();

    event.preventDefault();
  }

  decrementHour(event) {
    if (this.hourFormat == '24') {
      if (this.currentHour === 0)
        this.currentHour = 23;
      else
        this.currentHour--;
    }
    else if (this.hourFormat == '12') {
      if (this.currentHour === 0)
        this.currentHour = 12;
      else
        this.currentHour--;
    }

    this.updateTime();

    event.preventDefault();
  }

  incrementMinute(event) {
    if (this.currentMinute === 59)
      this.currentMinute = 0;
    else
      this.currentMinute++;

    this.updateTime();

    event.preventDefault();
  }

  decrementMinute(event) {
    if (this.currentMinute === 0)
      this.currentMinute = 59;
    else
      this.currentMinute--;

    this.updateTime();

    event.preventDefault();
  }

  updateTime() {
    this.value = this.value || new Date();
    if (this.hourFormat === '12' && this.pm && this.currentHour != 12)
      this.value.setHours(this.currentHour + 12);
    else
      this.value.setHours(this.currentHour);

    this.value.setMinutes(this.currentMinute);
    this.onModelChange(this.value);
    this.updateInputfield();
  }

  toggleAMPM(event) {
    this.pm = !this.pm;
    this.updateTime();
    event.preventDefault();
  }

  onInput(event) {
    try {
      let rawValue = event.target.value;
      let parsedValue;
      let parts: string[] = rawValue.split(' ');

      if (this.timeOnly) {
        parsedValue = new Date();
        this.populateTime(parsedValue, parts[0], parts[1]);
      }
      else {
        if (this.showTime) {
          parsedValue = this.parseDate(parts[0], this.dateFormat);
          this.populateTime(parsedValue, parts[1], parts[2]);
        }
        else {
          parsedValue = this.parseDate(event.target.value, this.dateFormat);
        }
      }

      this.value = parsedValue;
      this.updateUI();
    }
    catch (err) {
      //invalid date
      this.value = null;
    }

    this.onModelChange(this.value);
  }

  populateTime(value, timeString, ampm) {
    let time = this.parseTime(timeString);

    if (this.hourFormat == '12') {
      if (!ampm)
        throw 'Invalid Time';
      else if (ampm.toLowerCase() === 'PM' && time.hour != 12)
        value.setHours(time.hour + 12);
    }
    else {
      value.setHours(time.hour);
    }

    value.setMinutes(time.minute);
  }

  updateUI() {
    if (this.value) {
      this.createMonth(this.value.getMonth(), this.value.getFullYear());

      if (this.showTime || this.timeOnly) {
        this.currentHour = this.value.getHours();
        this.currentMinute = this.value.getMinutes();
      }
    }
  }

  onDatePickerClick(event) {
    this.closeOverlay = this.dateClick;
  }

  showOverlay(event) {
    if (this.appendTo)
      this.domHandler.absolutePosition(this.overlay, event.target);
    else
      this.domHandler.relativePosition(this.overlay, event.target);

    this.overlayVisible = true;
    this.overlay.style.zIndex = String(++DomHandler.zindex);
  }

  writeValue(value: any): void {
    this.value = value;
    if (this.inputfield) {
      if (value != null) {
        this.inputfield.value = this.formatDate(this.value, this.dateFormat);
        this.updateUI();
      } else {
        this.inputfield.value = '';
      }
    }
  }

  registerOnChange(fn: Function): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onModelTouched = fn;
  }

  setDisabledState(val: boolean): void {
    this.disabled = val;
  }

  // Ported from jquery-ui datepicker formatDate
  formatDate(date, format) {
    if (!date) {
      return '';
    }
    if (!date['getDate']) { //not a date
      date = new Date(date);
      this.value = date;
    }

    let iFormat,
      lookAhead = (match) => {
        let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
        if (matches) {
          iFormat++;
        }
        return matches;
      },
      formatNumber = (match, value, len) => {
        let num = '' + value;
        if (lookAhead(match)) {
          while (num.length < len) {
            num = '0' + num;
          }
        }
        return num;
      },
      formatName = (match, value, shortNames, longNames) => {
        return (lookAhead(match) ? longNames[value] : shortNames[value]);
      },
      output = '',
      literal = false;

    if (date) {
      for (iFormat = 0; iFormat < format.length; iFormat++) {
        if (literal) {
          if (format.charAt(iFormat) === '\'' && !lookAhead('\''))
            literal = false;
          else
            output += format.charAt(iFormat);
        }
        else {
          switch (format.charAt(iFormat)) {
            case 'd':
              output += formatNumber('d', date.getDate(), 2);
              break;
            case 'D':
              output += formatName('D', date.getDay(), this.locale.dayNamesShort, this.locale.dayNames);
              break;
            case 'o':
              output += formatNumber('o',
                Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
              break;
            case 'm':
              output += formatNumber('m', date.getMonth() + 1, 2);
              break;
            case 'M':
              output += formatName('M', date.getMonth(), this.locale.monthNamesShort, this.locale.monthNames);
              break;
            case 'y':
              output += (lookAhead('y') ? (date.getFullYear() + this.locale.yearOffset) :
                ((date.getFullYear() + this.locale.yearOffset) % 100 < 10 ? '0' : '') + (date.getFullYear() + this.locale.yearOffset) % 100);
              break;
            case '@':
              output += date.getTime();
              break;
            case '!':
              output += date.getTime() * 10000 + this.ticksTo1970;
              break;
            case '\'':
              if (lookAhead('\''))
                output += '\'';
              else
                literal = true;

              break;
            default:
              output += format.charAt(iFormat);
          }
        }
      }
    }
    return output;
  }

  formatTime(date) {
    if (!date) {
      return '';
    }

    let output = '';
    let hours = date.getHours();
    let minutes = date.getMinutes();

    if (this.hourFormat == '12' && this.pm && hours != 12) {
      hours -= 12;
    }

    output += (hours < 10) ? '0' + hours : hours;
    output += ':';
    output += (minutes < 10) ? '0' + minutes : minutes;

    if (this.hourFormat == '12') {
      output += this.pm ? ' PM' : ' AM';
    }

    return output;
  }

  parseTime(value) {
    let tokens: string[] = value.split(':');
    if (tokens.length !== 2) {
      throw 'Invalid time';
    }

    let h = parseInt(tokens[0]);
    let m = parseInt(tokens[1]);
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59 || (this.hourFormat == '12' && h > 12)) {
      throw 'Invalid time';
    }
    else {
      if (this.hourFormat == '12' && h !== 12) {
        h += 12;
      }

      return {hour: parseInt(tokens[0]), minute: parseInt(tokens[1])};
    }
  }

  // Ported from jquery-ui datepicker parseDate
  parseDate(value, format) {
    if (format == null || value == null) {
      throw 'Invalid arguments';
    }

    value = (typeof value === 'object' ? value.toString() : value + '');
    if (value === '') {
      return null;
    }

    let iFormat, dim, extra,
      iValue = 0,
      shortYearCutoff = (typeof this.shortYearCutoff !== 'string' ? this.shortYearCutoff : new Date().getFullYear() % 100 + parseInt(this.shortYearCutoff, 10)),
      year = -1,
      month = -1,
      day = -1,
      doy = -1,
      literal = false,
      date,
      lookAhead = (match) => {
        let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
        if (matches) {
          iFormat++;
        }
        return matches;
      },
      getNumber = (match) => {
        let isDoubled = lookAhead(match),
          size = (match === '@' ? 14 : (match === '!' ? 20 :
            (match === 'y' && isDoubled ? 4 : (match === 'o' ? 3 : 2)))),
          minSize = (match === 'y' ? size : 1),
          digits = new RegExp('^\\d{' + minSize + ',' + size + '}'),
          num = value.substring(iValue).match(digits);
        if (!num) {
          throw 'Missing number at position ' + iValue;
        }
        iValue += num[0].length;
        return parseInt(num[0], 10);
      },
      getName = (match, shortNames, longNames) => {
        let index = -1;
        let arr = lookAhead(match) ? longNames : shortNames;
        let names = [];

        for (let i = 0; i < arr.length; i++) {
          names.push([i, arr[i]]);
        }
        names.sort((a, b) => {
          return -(a[1].length - b[1].length);
        });

        for (let i = 0; i < names.length; i++) {
          let name = names[i][1];
          if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
            index = names[i][0];
            iValue += name.length;
            break;
          }
        }

        if (index !== -1) {
          return index + 1;
        } else {
          throw 'Unknown name at position ' + iValue;
        }
      },
      checkLiteral = () => {
        if (value.charAt(iValue) !== format.charAt(iFormat)) {
          throw 'Unexpected literal at position ' + iValue;
        }
        iValue++;
      };

    for (iFormat = 0; iFormat < format.length; iFormat++) {
      if (literal) {
        if (format.charAt(iFormat) === '\'' && !lookAhead('\'')) {
          literal = false;
        } else {
          checkLiteral();
        }
      } else {
        switch (format.charAt(iFormat)) {
          case 'd':
            day = getNumber('d');
            break;
          case 'D':
            getName('D', this.locale.dayNamesShort, this.locale.dayNames);
            break;
          case 'o':
            doy = getNumber('o');
            break;
          case 'm':
            month = getNumber('m');
            break;
          case 'M':
            month = getName('M', this.locale.monthNamesShort, this.locale.monthNames);
            break;
          case 'y':
            year = getNumber('y') - this.locale.yearOffset;
            break;
          case '@':
            date = new Date(getNumber('@'));
            year = date.getFullYear() - this.locale.yearOffset;
            month = date.getMonth() + 1;
            day = date.getDate();
            break;
          case '!':
            date = new Date((getNumber('!') - this.ticksTo1970) / 10000);
            year = date.getFullYear() - this.locale.yearOffset;
            month = date.getMonth() + 1;
            day = date.getDate();
            break;
          case '\'':
            if (lookAhead('\'')) {
              checkLiteral();
            } else {
              literal = true;
            }
            break;
          default:
            checkLiteral();
        }
      }
    }

    if (iValue < value.length) {
      extra = value.substr(iValue);
      if (!/^\s+/.test(extra)) {
        throw 'Extra/unparsed characters found in date: ' + extra;
      }
    }

    if (year === -1) {
      year = new Date().getFullYear();
    } else if (year < 100) {
      year += new Date().getFullYear() - new Date().getFullYear() % 100 +
        (year <= shortYearCutoff ? 0 : -100);
    }

    if (doy > -1) {
      month = 1;
      day = doy;
      do {
        dim = this.getDaysCountInMonth(year, month - 1);
        if (day <= dim) {
          break;
        }
        month++;
        day -= dim;
      } while (true);
    }

    date = this.daylightSavingAdjust(new Date(year, month - 1, day));
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
      throw new Error('Invalid date'); // E.g. 31/02/00
    }
    return date;
  }

  daylightSavingAdjust(date) {
    if (!date) {
      return null;
    }
    date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
    return date;
  }

  ngOnDestroy() {
    if (!this.inline && this.appendTo) {
      this.el.nativeElement.appendChild(this.overlay);
    }
  }

}
