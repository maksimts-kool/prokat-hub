import type { StaffRentalDto } from '@/api/generated/model'

export type DeskActionKind = 'issue' | 'receive' | 'markLate'

export interface DeskAction {
  kind: DeskActionKind
  rental: StaffRentalDto
}

/**
 * What the desk can do with a rental today, as the API allows it: issue a Booked rental from its
 * start date to its end date, receive an Issued or Overdue one, and mark one late once its end date
 * has passed.
 */
export function deskActions(rental: StaffRentalDto, today: string): DeskActionKind[] {
  switch (rental.status) {
    case 'Booked':
      return rental.startDate <= today && today <= rental.endDate ? ['issue'] : []
    case 'Issued':
      return rental.endDate < today ? ['receive', 'markLate'] : ['receive']
    case 'Overdue':
      return ['receive', 'markLate']
    default:
      return []
  }
}
