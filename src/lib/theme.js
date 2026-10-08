// The app's colour palette ("Harbour"). Tailwind's colour names in
// tailwind.config.js and the chart colours in the components both read from here,
// so changing a value below restyles the whole app.

export const theme = {
  bg: '#0E1526', // page background
  surface: '#141D33', // cards, nav bar
  field: '#1B2640', // inputs, empty calendar days, progress tracks
  line: '#26324F', // borders and dividers
  faint: '#5A6886',
  muted: '#8E9BB5', // secondary text
  text: '#E8EDF7', // main text
  accent: '#7FA7D9', // saved amounts, active tab, buttons
  accentStrong: '#6A93C8',
  income: '#5CC4A1', // income text
  incomeBar: '#3FA585',
  incomeDark: '#33896F',
  spent: '#F07A7A', // spending text
  spentBar: '#D95F5F', // spending bars and calendar heat
  highlight: '#F2B66D', // subscription totals
  highlightStrong: '#E9A04F',
}
