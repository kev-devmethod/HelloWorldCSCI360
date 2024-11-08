export const FEATURED_LOCATIONS = [
  {
    id: 1,
    name: 'Randolph Hall',
    image: require('@/assets/images/randolph-hall.png'),
    description: 'Historic centerpiece of the College of Charleston campus',
    coordinate: {
      latitude: 32.78410178921882,
      longitude: -79.93749222209023
    }
  },
  {
    id: 2, 
    name: 'Cistern Yard',
    image: require('@/assets/images/cistern-yard.png'),
    description: 'Iconic graduation venue surrounded by live oaks',
    coordinate: {
      latitude: 32.7839657124527,
      longitude: -79.9373457191885
    }
  },
  {
    id: 3,
    name: 'Addlestone Library',
    image: require('@/assets/images/library.png'), 
    description: 'Modern library facility with extensive resources',
    coordinate: {
      latitude: 32.78440841119022,
      longitude: -79.93979557500803
    }
  }
] as const;