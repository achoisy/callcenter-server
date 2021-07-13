import moment, { LocaleSpecification, Moment } from 'moment';
import 'moment-business-time';

interface CheckOpening {
  isOpen: boolean;
  nextOpeningTime?: Date;
  nextOpeningTimeLocal?: string;
}

class BusinessTime {
  config({ workinghours, holidays }: LocaleSpecification) {
    moment.locale('fr', {
      workinghours,
      holidays,
    });
  }

  checkOpening() {
    if (moment().isWorkingDay()) {
      if (moment().isWorkingTime()) {
        return { isOpen: true };
      }
    }
    return {
      isOpen: false,
      nextOpeningTime: moment().nextWorkingTime().toDate(),
      nextOpeningTimeLocal: moment().nextWorkingTime().format('LLLL'),
    };
  }
}

export const businessTime = new BusinessTime();
