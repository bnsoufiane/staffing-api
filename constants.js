module.exports.STAFFING_S3_BUCKET = 'staffing-resources';

module.exports.AWS_CONFIG = Object.freeze({
  region: 'us-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET
});

module.exports.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

module.exports.DATE_FORMAT = 'MM/DD/YYYY';

module.exports.SERVER_DATE_FORMAT = 'YYYY-MM-DD';

module.exports.INDEED_BASE_URL = 'http://www.indeed.com';

module.exports.INDEED_QUERY_URL = 'http://www.indeed.com/jobs?';

module.exports.CRUNCHBOARD_BASE_URL = 'http://www.crunchboard.com/';

module.exports.CRUNCHBOARD_QUERY_URL = 'http://www.crunchboard.com/jobs?';

module.exports.ANGEL_BASE_URL = 'https://angel.co/users/login?after_sign_in=/jobs/';

module.exports.ANGEL_COMPANIES_URL = 'https://angel.co/companies';

module.exports.DEFAULT_SCRAPE_LIMIT = 100;

module.exports.INDEED_DEFAULT_TERMS = 'iOS,Android&radius=25';

module.exports.DEFAULT_CRON_TIMEZONE = 'America/New_York';

module.exports.LOCATIONS = ['New York', 'Boston', 'Los Angeles', 'San Francisco'];

module.exports.DEFAULT_PAGE_SIZE = 10;

module.exports.CLIENT_URLS = {
  get ACCOUNT() {
    return process.env.APP_ENV === 'production' ?
      'http://accounts.punch-agency.com' : 'http://localhost:5555';
  },

  get DATA() {
    return process.env.APP_ENV === 'production' ?
      'http://data.punch-agency.com' : 'http://localhost:5556';
  }
}

module.exports.OAUTH = {
  GOOGLE: {
    CLIENT_ID: '981370199724-22lkqbqd3a51j5rdchaj7cfloekvqhvg.apps.googleusercontent.com',
    CLIENT_SECRET: 'QJM_vy5MFP_eqEa46aFxlYL9',
    get REDIRECT_URL() {
        return module.exports.CLIENT_URLS.ACCOUNT + '/oauth/google';
    }
  },
  LINKEDIN: {
    CLIENT_ID: '75pnz396dgsspl',
    CLIENT_SECRET: '2QjDeG9281QsI0Sa',
    get REDIRECT_URL() {
      return module.exports.CLIENT_URLS.ACCOUNT + '/oauth/linkedin';
    }
  }
};

module.exports.NO_REPLY_EMAIL = {
  email: 'info@punch-agency.com',
  name: 'No Reply'
};

module.exports.EXPIRATION_DAYS = 7;

//CrunchBase
module.exports.CRUNCHBASE_BASE_URL = 'https://www.crunchbase.com/';
module.exports.CRUNCHBASE_API_URL = 'https://a0ef2haqr0-2.algolia.io/1/indexes/company_advanced_search_production/query';
module.exports.CRUNCHBASE_API_KEY = '4568c46b5c97886c88b28f311616ed62';
module.exports.CRUNCHBASE_APP_ID = 'A0EF2HAQR0';

//Craft
module.exports.CRAFT_BASE_URL = 'https://craft.co/';
module.exports.CRAFT_QUERY_URL = 'https://craft.co/search';

//Yelp
module.exports.YELP_BASE_URL = 'http://www.yelp.com/';
module.exports.YELP_QUERY_URL = 'http://www.yelp.com/search?find_loc=';
//Owler
module.exports.OWLER_BASE_URL = 'https://www.owler.com/';

//proxies sources
module.exports.PROXY_SOURCE = Object.freeze({
  all: 0,
  USProxy: 1,
  inCloak: 2,
  UKProxy: 3,
  proxyServerList: 4,
  hideMyAss: 5
});

module.exports.CITIES = [
  'San Francisco, CA', 'Los Angeles, CA', 'New York', 'Boston, MA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Seattle, WA', 'Austin, TX',
  'Dallas, TX', 'San Diego, CA', 'Sacramento, CA', 'San Jose, CA', 'Oakland, CA', 'Santa Barbara, CA', 'Santa Monica, CA', 'Philadelphia, PA',
  'San Antonio, TX', 'Jacksonville', 'Indianapolis',
  'Columbus', 'Fort Worth', 'Charlotte', 'Denver', 'El Paso', 'Detroit', 'Washington', 'Memphis', 'Nashville', 'Portland', 'Oklahoma City',
  'Las Vegas', 'Baltimore', 'Louisville', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Kansas City', 'Long Beach', 'Mesa', 'Atlanta',
  'Colorado Springs', 'Virginia Beach', 'Raleigh', 'Omaha', 'Miami', 'Minneapolis', 'Tulsa', 'Wichita', 'New Orleans', 'Arlington',
  'Cleveland', 'Bakersfield', 'Tampa', 'Aurora', 'Honolulu', 'Anaheim', 'Santa Ana', 'Corpus Christi', 'Riverside', 'St. Louis, Mo',
  'Lexington', 'Stockton', 'Pittsburgh', 'Saint Paul', 'Anchorage', 'Cincinnati', 'Henderson', 'Greensboro', 'Plano', 'Newark'
];

module.exports.ELASTIC_TYPES = {
  COMPANY: 'company',
  JOB: 'job'
};
