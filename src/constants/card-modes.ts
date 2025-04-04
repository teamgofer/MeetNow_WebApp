/**
 * Card display mode constants
 * Defines the different modes a card component can be in
 */

export enum CardMode {
  MEETUP_DISPLAY = 'meetup_display', // Display an existing meetup
  LOCATION_DISPLAY = 'location_display', // Display a map location
  CREATE_FORM = 'create_form', // Show meetup creation form
  EDIT_FORM = 'edit_form', // Show meetup edit form
  HIDDEN = 'hidden', // Card is hidden
}
