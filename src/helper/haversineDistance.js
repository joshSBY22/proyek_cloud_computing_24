const haversineDistance = (latitude1, longitude1, latitude2, longitude2) => {
  const lat1 = parseFloat(latitude1);
  const lon1 = parseFloat(longitude1);
  const lat2 = parseFloat(latitude2);
  const lon2 = parseFloat(longitude2);
  
  const toRadians = (degree) => (degree * Math.PI) / 180;

  const R = 6371; // Radius of Earth in kilometers. Use 3958.8 for miles
  const theta1 = toRadians(lat1);
  const theta2 = toRadians(lat2);
  const deltaTheta = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a = Math.sin(deltaTheta / 2) ** 2 +
            Math.cos(theta1) * Math.cos(theta2) * Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

const findNearbyTickets = (tickets, userLat, userLon, maxDistance) => {
  maxDistance = parseFloat(maxDistance);
  return tickets.filter((ticket) => {
    const distance = haversineDistance(userLat, userLon, ticket.latitude_position, ticket.longitude_position);
    // console.log(distance + " Km");
    
    return distance <= maxDistance;
  });
};

module.exports = {
  haversineDistance,
  findNearbyTickets,
};