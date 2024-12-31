const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
}

function isValidLatitude(lat) {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lon) {
  return lon >= -180 && lon <= 180;
}

module.exports = {
  formatCurrency,
  isValidLatitude,
  isValidLongitude,
}