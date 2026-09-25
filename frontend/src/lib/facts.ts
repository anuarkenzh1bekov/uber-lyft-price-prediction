// Real figures behind the model: counted from datasets/cab_rides.csv and
// copied from the evaluation cells of main.ipynb (sklearn test split).
export const FACTS = {
  pricedRides: 637_976,
  r2: 0.908,
  rmse: 2.83,
  minDistance: 0.02,
  maxDistance: 7.86,
  neighborhoods: [
    'Back Bay',
    'Beacon Hill',
    'Boston University',
    'Fenway',
    'Financial District',
    'Haymarket Square',
    'North End',
    'North Station',
    'Northeastern University',
    'South Station',
    'Theatre District',
    'West End',
  ],
} as const

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

export const numberWord = (n: number) => WORDS[n] ?? String(n)
