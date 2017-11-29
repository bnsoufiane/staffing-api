var UserModel = require('./users-resource');

module.exports = function(monky) {
  monky.factory('User', {
    firstName: "User #n",
    lastName: "Last name of the user #n",
    password: "password#n",
    email: "user_#n@example.com",
    dribbble_id: "dribbble_id_#n",
    behance_id: "behance_id_#n"
  });

  return monky;
};
