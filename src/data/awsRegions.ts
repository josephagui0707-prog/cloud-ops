export type RegionAccess = 'default' | 'opt-in';

export type AWSRegion = {
  code: string;
  name: string;
  location: string;
  country: string;
  continent: string;
  access: RegionAccess;
  coordinates: [number, number];
};

export const awsRegions: AWSRegion[] = [
  { code: 'us-east-1', name: 'US East (N. Virginia)', location: 'Virginia', country: 'United States', continent: 'North America', access: 'default', coordinates: [-77.04, 38.91] },
  { code: 'us-east-2', name: 'US East (Ohio)', location: 'Ohio', country: 'United States', continent: 'North America', access: 'default', coordinates: [-82.91, 40.42] },
  { code: 'us-west-1', name: 'US West (N. California)', location: 'California', country: 'United States', continent: 'North America', access: 'default', coordinates: [-121.89, 37.34] },
  { code: 'us-west-2', name: 'US West (Oregon)', location: 'Oregon', country: 'United States', continent: 'North America', access: 'default', coordinates: [-122.68, 45.52] },
  { code: 'ca-central-1', name: 'Canada (Central)', location: 'Central Canada', country: 'Canada', continent: 'North America', access: 'default', coordinates: [-79.38, 43.65] },
  { code: 'ca-west-1', name: 'Canada West (Calgary)', location: 'Alberta', country: 'Canada', continent: 'North America', access: 'opt-in', coordinates: [-114.07, 51.04] },
  { code: 'mx-central-1', name: 'Mexico (Central)', location: 'Central Mexico', country: 'Mexico', continent: 'North America', access: 'opt-in', coordinates: [-99.13, 19.43] },

  { code: 'sa-east-1', name: 'South America (São Paulo)', location: 'São Paulo', country: 'Brazil', continent: 'South America', access: 'default', coordinates: [-46.63, -23.55] },

  { code: 'af-south-1', name: 'Africa (Cape Town)', location: 'Cape Town', country: 'South Africa', continent: 'Africa', access: 'opt-in', coordinates: [18.42, -33.92] },

  { code: 'eu-west-1', name: 'Europe (Ireland)', location: 'Dublin', country: 'Ireland', continent: 'Europe', access: 'default', coordinates: [-6.26, 53.35] },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)', location: 'Frankfurt', country: 'Germany', continent: 'Europe', access: 'default', coordinates: [8.68, 50.11] },
  { code: 'eu-central-2', name: 'Europe (Zurich)', location: 'Zurich', country: 'Switzerland', continent: 'Europe', access: 'opt-in', coordinates: [8.54, 47.38] },
  { code: 'eu-west-2', name: 'Europe (London)', location: 'London', country: 'United Kingdom', continent: 'Europe', access: 'default', coordinates: [-0.13, 51.51] },
  { code: 'eu-west-3', name: 'Europe (Paris)', location: 'Paris', country: 'France', continent: 'Europe', access: 'default', coordinates: [2.35, 48.86] },
  { code: 'eu-north-1', name: 'Europe (Stockholm)', location: 'Stockholm', country: 'Sweden', continent: 'Europe', access: 'default', coordinates: [18.07, 59.33] },
  { code: 'eu-south-1', name: 'Europe (Milan)', location: 'Milan', country: 'Italy', continent: 'Europe', access: 'opt-in', coordinates: [9.19, 45.46] },
  { code: 'eu-south-2', name: 'Europe (Spain)', location: 'Aragón', country: 'Spain', continent: 'Europe', access: 'opt-in', coordinates: [-3.70, 40.42] },

  { code: 'il-central-1', name: 'Israel (Tel Aviv)', location: 'Tel Aviv', country: 'Israel', continent: 'Middle East', access: 'opt-in', coordinates: [34.78, 32.09] },
  { code: 'me-central-1', name: 'Middle East (UAE)', location: 'United Arab Emirates', country: 'United Arab Emirates', continent: 'Middle East', access: 'opt-in', coordinates: [54.38, 24.45] },
  { code: 'me-south-1', name: 'Middle East (Bahrain)', location: 'Bahrain', country: 'Bahrain', continent: 'Middle East', access: 'opt-in', coordinates: [50.59, 26.07] },

  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', location: 'Tokyo', country: 'Japan', continent: 'Asia Pacific', access: 'default', coordinates: [139.69, 35.69] },
  { code: 'ap-northeast-2', name: 'Asia Pacific (Seoul)', location: 'Seoul', country: 'South Korea', continent: 'Asia Pacific', access: 'default', coordinates: [126.98, 37.57] },
  { code: 'ap-northeast-3', name: 'Asia Pacific (Osaka)', location: 'Osaka', country: 'Japan', continent: 'Asia Pacific', access: 'default', coordinates: [135.50, 34.69] },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)', location: 'Mumbai', country: 'India', continent: 'Asia Pacific', access: 'default', coordinates: [72.88, 19.08] },
  { code: 'ap-south-2', name: 'Asia Pacific (Hyderabad)', location: 'Hyderabad', country: 'India', continent: 'Asia Pacific', access: 'opt-in', coordinates: [78.49, 17.39] },
  { code: 'ap-east-1', name: 'Asia Pacific (Hong Kong)', location: 'Hong Kong', country: 'Hong Kong', continent: 'Asia Pacific', access: 'opt-in', coordinates: [114.17, 22.32] },
  { code: 'ap-east-2', name: 'Asia Pacific (Taipei)', location: 'Taipei', country: 'Taiwan', continent: 'Asia Pacific', access: 'opt-in', coordinates: [121.57, 25.03] },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', location: 'Singapore', country: 'Singapore', continent: 'Asia Pacific', access: 'default', coordinates: [103.82, 1.35] },
  { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)', location: 'Sydney', country: 'Australia', continent: 'Asia Pacific', access: 'default', coordinates: [151.21, -33.87] },
  { code: 'ap-southeast-3', name: 'Asia Pacific (Jakarta)', location: 'Jakarta', country: 'Indonesia', continent: 'Asia Pacific', access: 'opt-in', coordinates: [106.85, -6.21] },
  { code: 'ap-southeast-4', name: 'Asia Pacific (Melbourne)', location: 'Melbourne', country: 'Australia', continent: 'Asia Pacific', access: 'opt-in', coordinates: [144.96, -37.81] },
  { code: 'ap-southeast-5', name: 'Asia Pacific (Malaysia)', location: 'Kuala Lumpur', country: 'Malaysia', continent: 'Asia Pacific', access: 'opt-in', coordinates: [101.69, 3.14] },
  { code: 'ap-southeast-6', name: 'Asia Pacific (New Zealand)', location: 'Auckland', country: 'New Zealand', continent: 'Asia Pacific', access: 'opt-in', coordinates: [174.76, -36.85] },
  { code: 'ap-southeast-7', name: 'Asia Pacific (Thailand)', location: 'Bangkok', country: 'Thailand', continent: 'Asia Pacific', access: 'opt-in', coordinates: [100.50, 13.76] }
];

export const awsContinents = [
  'All',
  ...Array.from(
    new Set(awsRegions.map((region) => region.continent))
  )
];