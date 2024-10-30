export const FEATURED_LOCATIONS = [
  {
    id: 1,
    name: 'Randolph Hall',
    image: require('@/assets/images/randolph-hall.png'),
    description: 'Historic centerpiece of the College of Charleston campus',
    coordinate: {
      latitude: 32.783832,
      longitude: -79.937160
    }
  },
  {
    id: 2, 
    name: 'Cistern Yard',
    image: require('@/assets/images/cistern-yard.png'),
    description: 'Iconic graduation venue surrounded by live oaks',
    coordinate: {
      latitude: 32.783740,
      longitude: -79.937080
    }
  },
  {
    id: 3,
    name: 'Addlestone Library',
    image: require('@/assets/images/library.png'), 
    description: 'Modern library facility with extensive resources',
    coordinate: {
      latitude: 32.783608,
      longitude: -79.937340
    }
  }
] as const;