import { NgModule } from '@angular/core';
import { CalendarComponent } from './calendar.component';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [CommonModule, FormsModule],
  exports: [CalendarComponent],
  declarations: [CalendarComponent]
})
export class CalendarModule { }
